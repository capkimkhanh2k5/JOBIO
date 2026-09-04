import re
path = 'frontend/src/components/company/ManageJobsList.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'<div\n\s*className="flex-1 min-w-0 cursor-pointer"\n\s*onClick=\{',
    r'<div\n                            role="button"\n                            tabIndex={0}\n                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate(`/jobs/${job.id}`)}\n                            className="flex-1 min-w-0 cursor-pointer"\n                            onClick={',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

