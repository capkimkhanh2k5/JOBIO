import re

path = 'frontend/src/components/shared/Logo.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'className=\{imageClassName\}',
    r'className={imageClassName}\n                    loading="eager"\n                    fetchPriority="high"',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
