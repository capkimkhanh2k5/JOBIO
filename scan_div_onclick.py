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
                # find <div onClick=... but without role="button"
                divs = re.findall(r'<div[^>]*\bonClick\b[^>]*>', content)
                for div in divs:
                    if 'role="button"' not in div and 'role=\'button\'' not in div and 'role="tab"' not in div and 'role="link"' not in div:
                        print(f"{path}: {div.strip()}")

scan()
