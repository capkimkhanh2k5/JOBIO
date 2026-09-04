import os
import re

def scan():
    base = 'frontend/src/components'
    for root, _, files in os.walk(base):
        for f in files:
            if not f.endswith('.tsx') and not f.endswith('.jsx'): continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
                for i, line in enumerate(lines):
                    # find things like w-[300px] or w-[50rem]
                    match = re.search(r'\bw-\[([0-9]+)px\]', line)
                    if match:
                        if int(match.group(1)) > 300:
                            print(f"{path}:{i+1} - {line.strip()}")
scan()
