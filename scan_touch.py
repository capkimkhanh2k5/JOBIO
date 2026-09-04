import os
import re

def scan():
    base = 'frontend/src/components'
    for root, _, files in os.walk(base):
        for f in files:
            if not f.endswith('.tsx') and not f.endswith('.jsx'): continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                content = file.read()
                # Find <button> or Button or a with small padding/size
                # Since we use tailwind, size might be w-6 h-6 (24px) or p-1 or size-8 (32px)
                # It's hard to statically analyze accurately, but we can look for "w-4", "w-5", "w-6", "h-4", "h-5", "h-6", "size-4", "size-5", "size-6" inside <button> tags or Button tags.
                # Just a quick check for 'Button className=".*(w-6|h-6|size-6).*"'
                buttons = re.findall(r'<(?:button|Button)[^>]*className=[\'"][^\'"]*\b(w-[1-7]\b|h-[1-7]\b|size-[1-7]\b|p-[0-1]\b)[^\'"]*[\'"]', content)
                if buttons:
                    print(f"{path}: {len(buttons)} small buttons found")

scan()
