import os
import re

base = 'frontend/src/components'
for root, _, files in os.walk(base):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Replace p-0 h-auto on link buttons with p-2 -m-2 h-auto to preserve layout but expand touch target
            content = re.sub(r'className="p-0\s+h-auto([^"]*text-sm[^"]*)"', r'className="p-2 -mx-2 h-auto\1"', content)
            content = re.sub(r'className="p-0\s+h-auto([^"]*text-primary[^"]*)"', r'className="p-2 -mx-2 h-auto\1"', content)
            
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
print("done")
