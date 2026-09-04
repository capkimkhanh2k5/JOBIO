import os
import re

base = 'frontend/src/components'
img_no_lazy = []
will_change = []

for root, _, files in os.walk(base):
    for f in files:
        if f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                lines = file.readlines()
            
            for i, line in enumerate(lines):
                if '<img ' in line and 'loading=' not in line and 'lazy' not in line:
                    # check if the next lines contain loading=lazy
                    img_chunk = "".join(lines[i:i+5])
                    if 'loading=' not in img_chunk:
                        img_no_lazy.append((f, i+1))
                if 'will-change' in line or 'willChange' in line:
                    will_change.append((f, i+1, line.strip()))

print("Images without loading attribute:")
for item in img_no_lazy:
    print(f"{item[0]}:{item[1]}")

print("\nwill-change usage:")
for item in will_change:
    print(f"{item[0]}:{item[1]} -> {item[2]}")

