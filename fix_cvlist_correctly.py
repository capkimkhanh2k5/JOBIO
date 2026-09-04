import re
path = 'frontend/src/components/candidate/cv/CVListSidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <div onClick={onCreateNew}> with <button type="button" onClick={onCreateNew}>
# And the corresponding </div> with </button>
content = re.sub(
    r'<div\s+onClick=\{onCreateNew\}([^>]+)>\s*<Plus([^>]+)>\s*</div>',
    r'<button type="button" onClick={onCreateNew}\1>\n                    <Plus\2>\n                </button>',
    content
)

# Fix onSelect cv div
content = re.sub(
    r'<div\s*\n\s*onClick=\{\(\) => onSelect\(cv\)\}',
    r'<div\n                                role="button"\n                                tabIndex={0}\n                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(cv)}\n                                onClick={() => onSelect(cv)}',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

