import re

path = 'frontend/src/components/candidate/cv/CVListSidebar.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix onCreateNew div
content = re.sub(
    r'<div\s+onClick=\{onCreateNew\}',
    r'<button type="button" onClick={onCreateNew}',
    content
)
# The closing tag for this div is around line 102. It's inside a flex header.
# I will just replace the closing </div> that corresponds to it, but it's tricky.
# Wait, actually:
# <div onClick={onCreateNew} className="..." title="..."> <Plus ... /> </div>
# I'll just regex replace the specific block.
content = re.sub(
    r'<div(\s+onClick=\{onCreateNew\}[^>]+)>\s*<Plus([^>]+)>\s*</div>',
    r'<button type="button"\1>\n                    <Plus\2>\n                </button>',
    content
)

# Fix onSelect cv div
# <div onClick={() => onSelect(cv)} ...>
content = re.sub(
    r'<div\s*\n\s*onClick=\{\(\) => onSelect\(cv\)\}',
    r'<div\n                                role="button"\n                                tabIndex={0}\n                                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(cv)}\n                                onClick={() => onSelect(cv)}',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

