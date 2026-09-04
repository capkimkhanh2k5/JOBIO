import os
import re

base = 'frontend/src/components'
for root, _, files in os.walk(base):
    for f in files:
        if 'Layout.tsx' in f:
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # pb-[64px] -> pb-[calc(64px+env(safe-area-inset-bottom))]
            content = content.replace('pb-[64px]', 'pb-[calc(64px+env(safe-area-inset-bottom))]')
            
            with open(path, 'w', encoding='utf-8') as file:
                file.write(content)
print("done")
