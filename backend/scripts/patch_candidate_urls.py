import os


def patch_file(filepath):
    with open(filepath, "r") as f:
        content = f.read()

    new_content = content.replace("/api/recruiters/", "/api/candidates/")

    if content != new_content:
        with open(filepath, "w") as f:
            f.write(new_content)
        print(f"Patched {filepath}")


for root, _, files in os.walk("apps/candidate"):
    if "tests" in root:
        for file in files:
            if file.startswith("test_") and file.endswith(".py"):
                patch_file(os.path.join(root, file))
