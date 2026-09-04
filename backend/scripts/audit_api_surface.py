#!/usr/bin/env python3
"""Audit backend API routes against frontend API literals.

Run from the backend directory:
    python scripts/audit_api_surface.py

The script intentionally uses Django's URL resolver as the backend source of
truth, then compares it with `/api/...` string literals in the React source.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_FRONTEND_SRC = BACKEND_ROOT.parent / "frontend" / "src"
METHODS_TO_IGNORE = {"HEAD", "OPTIONS", "TRACE"}
FRONTEND_EXTENSIONS = {".ts", ".tsx", ".js", ".jsx"}
API_LITERAL_RE = re.compile(r"""(?P<quote>[`'"])(?P<value>/api/.*?)(?P=quote)""")
IMPORT_RE = re.compile(
    r"""(?:import\s+(?:[^'"]+\s+from\s+)?|import\s*\(\s*)(?P<quote>['"])(?P<path>[^'"]+)(?P=quote)"""
)


def configure_django() -> None:
    sys.path.insert(0, str(BACKEND_ROOT))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings_test")

    import django

    django.setup()


def clean_pattern(pattern: object) -> str:
    text = str(pattern)
    return (
        text.replace("^", "")
        .replace("\\Z", "")
        .replace("$", "")
        .replace("(?P<format>[a-z0-9]+)/?", "{format}/")
        .replace("\\.", ".")
    )


def canonical_backend_path(path: str) -> str:
    path = path.replace("<drf_format_suffix:format>", "").replace(".{format}", "")
    path = re.sub(r"\(\?P<[^>]+>\[[^)]*\]\+\)", "<param>", path)
    path = re.sub(r"<int:[^>]+>", "<param>", path)
    path = path.replace("(?P<provider>[/.]+)", "<param>")
    return "/" + path.strip("/") + "/"


def canonical_frontend_path(path: str) -> str:
    value = path.split("?", 1)[0]
    value = re.sub(r"\$\{[^}]+\}", "<param>", value)
    value = re.sub(r":\w+", "<param>", value)
    if not value.endswith("/"):
        value += "/"
    return re.sub(r"/+", "/", value)


def methods_for_urlpattern(pattern: object) -> set[str]:
    callback = pattern.callback
    actions = getattr(callback, "actions", None)
    if actions:
        return {
            method.upper()
            for method in actions
            if method.upper() not in METHODS_TO_IGNORE
        }

    view_class = getattr(callback, "view_class", None) or getattr(callback, "cls", None)
    if view_class is not None:
        methods = {
            method.upper()
            for method in getattr(view_class, "http_method_names", [])
            if method.upper() not in METHODS_TO_IGNORE
        }
        return methods or {"GET"}

    return {"GET"}


def iter_backend_patterns(patterns: list[object], prefix: str = ""):
    from django.urls import URLPattern, URLResolver

    for entry in patterns:
        path = prefix + clean_pattern(entry.pattern)
        if isinstance(entry, URLResolver):
            yield from iter_backend_patterns(entry.url_patterns, path)
        elif isinstance(entry, URLPattern) and path.startswith("api/"):
            yield canonical_backend_path(path), methods_for_urlpattern(entry)


def collect_backend_routes() -> dict[str, set[str]]:
    from django.urls import get_resolver

    routes: dict[str, set[str]] = {}
    for path, methods in iter_backend_patterns(get_resolver().url_patterns):
        if path in {"/api/", "/api/<param>/"}:
            continue
        routes.setdefault(path, set()).update(methods)
    return routes


def resolve_frontend_import(
    specifier: str, current_file: Path, frontend_src: Path
) -> Path | None:
    if specifier.startswith("@/"):
        base = frontend_src / specifier[2:]
    elif specifier.startswith("."):
        base = current_file.parent / specifier
    else:
        return None

    candidates = [base]
    candidates.extend(base.with_suffix(extension) for extension in FRONTEND_EXTENSIONS)
    candidates.extend(base / f"index{extension}" for extension in FRONTEND_EXTENSIONS)

    for candidate in candidates:
        if candidate.exists() and candidate.suffix in FRONTEND_EXTENSIONS:
            return candidate.resolve()
    return None


def collect_reachable_frontend_files(frontend_src: Path, entrypoint: Path) -> set[Path]:
    entry = entrypoint if entrypoint.is_absolute() else frontend_src / entrypoint
    if not entry.exists():
        return set()

    reachable: set[Path] = set()
    pending = [entry.resolve()]
    while pending:
        current = pending.pop()
        if current in reachable or current.suffix not in FRONTEND_EXTENSIONS:
            continue
        reachable.add(current)

        text = current.read_text(encoding="utf-8", errors="ignore")
        for match in IMPORT_RE.finditer(text):
            imported = resolve_frontend_import(
                match.group("path"), current, frontend_src
            )
            if imported and imported not in reachable:
                pending.append(imported)
    return reachable


def collect_frontend_api_literals(
    frontend_src: Path,
    files: set[Path] | None = None,
) -> dict[str, set[str]]:
    literals: dict[str, set[str]] = {}
    if not frontend_src.exists():
        return literals

    source_files = files if files is not None else set(frontend_src.rglob("*"))
    for path in source_files:
        if path.suffix not in FRONTEND_EXTENSIONS:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in API_LITERAL_RE.finditer(text):
            literal = canonical_frontend_path(match.group("value"))
            literals.setdefault(literal, set()).add(str(path))
    return literals


def path_matches_backend(frontend_path: str, backend_paths: set[str]) -> bool:
    if frontend_path in backend_paths:
        return True

    for backend_path in backend_paths:
        regex = "^" + re.escape(backend_path).replace("<param>", "[^/]+") + "$"
        if re.match(regex, frontend_path):
            return True
    return False


def unmatched_frontend_literals(
    frontend_literals: dict[str, set[str]],
    backend_paths: set[str],
) -> list[dict[str, object]]:
    return [
        {
            "path": frontend_path,
            "files": sorted(files),
        }
        for frontend_path, files in sorted(frontend_literals.items())
        if not path_matches_backend(frontend_path, backend_paths)
    ]


def build_report(frontend_src: Path, entrypoint: Path) -> dict[str, object]:
    backend_routes = collect_backend_routes()
    backend_paths = set(backend_routes)
    frontend_literals = collect_frontend_api_literals(frontend_src)
    reachable_files = collect_reachable_frontend_files(frontend_src, entrypoint)
    reachable_literals = collect_frontend_api_literals(frontend_src, reachable_files)
    unmatched = unmatched_frontend_literals(frontend_literals, backend_paths)
    reachable_unmatched = unmatched_frontend_literals(reachable_literals, backend_paths)
    prefixes = Counter(path.strip("/").split("/")[1] for path in backend_routes)

    return {
        "backend": {
            "unique_paths": len(backend_routes),
            "method_operations": sum(
                len(methods) for methods in backend_routes.values()
            ),
            "top_prefixes": dict(prefixes.most_common()),
        },
        "frontend": {
            "api_literals": len(frontend_literals),
            "unmatched_api_literals": len(unmatched),
            "unmatched": unmatched,
            "reachable_files": len(reachable_files),
            "reachable_api_literals": len(reachable_literals),
            "reachable_unmatched_api_literals": len(reachable_unmatched),
            "reachable_unmatched": reachable_unmatched,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--frontend-src",
        type=Path,
        default=DEFAULT_FRONTEND_SRC,
        help="Path to the frontend src directory.",
    )
    parser.add_argument(
        "--entrypoint",
        type=Path,
        default=Path("App.tsx"),
        help="Frontend entrypoint relative to --frontend-src for reachable-file audit.",
    )
    parser.add_argument(
        "--json", action="store_true", help="Print machine-readable JSON."
    )
    args = parser.parse_args()

    configure_django()
    report = build_report(args.frontend_src, args.entrypoint)

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
        return 0

    backend = report["backend"]
    frontend = report["frontend"]
    print(f"Backend unique API paths: {backend['unique_paths']}")
    print(f"Backend method operations: {backend['method_operations']}")
    print(f"Frontend API literals: {frontend['api_literals']}")
    print(f"Unmatched frontend API literals: {frontend['unmatched_api_literals']}")
    print(f"Reachable frontend files: {frontend['reachable_files']}")
    print(f"Reachable frontend API literals: {frontend['reachable_api_literals']}")
    print(
        "Reachable unmatched frontend API literals: "
        f"{frontend['reachable_unmatched_api_literals']}"
    )
    if frontend["unmatched"]:
        print("\nUnmatched frontend API literals:")
        for item in frontend["unmatched"]:
            files = ", ".join(
                Path(file_name).relative_to(BACKEND_ROOT.parent).as_posix()
                for file_name in item["files"][:3]
            )
            print(f"- {item['path']} :: {files}")
    if frontend["reachable_unmatched"]:
        print("\nReachable unmatched frontend API literals:")
        for item in frontend["reachable_unmatched"]:
            files = ", ".join(
                Path(file_name).relative_to(BACKEND_ROOT.parent).as_posix()
                for file_name in item["files"][:3]
            )
            print(f"- {item['path']} :: {files}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
