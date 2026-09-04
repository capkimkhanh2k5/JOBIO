import re

path = 'frontend/src/components/jobs/JobCard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace animate={{ opacity: 1, y: 0 }} with whileInView
content = content.replace(
    'animate={{ opacity: 1, y: 0 }}',
    'whileInView={{ opacity: 1, y: 0 }}\n            viewport={{ once: true, margin: "50px" }}'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

