import os
import re

files_to_fix = [
    'frontend/src/components/candidate/cv/CVBuilder.tsx',
    'frontend/src/components/candidate/cv/NewCVDialog.tsx',
    'frontend/src/components/candidate/cv/CVListSidebar.tsx',
    'frontend/src/components/admin/AdminTopNav.tsx'
]

for path in files_to_fix:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to add loading="lazy" to <img> tags that don't have it
    # We replace <img (anything except loading=) > with <img loading="lazy" \1 >
    # This is a bit tricky with multiline. 
    # Since we know they don't have it, we can just replace `<img` with `<img loading="lazy"`
    # But wait, there might be other imgs that already have it.
    content = re.sub(r'<img(?![^>]*loading=)', r'<img loading="lazy"', content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("done")
