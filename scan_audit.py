import os
import re

def scan():
    results = {
        'a11y_missing_alt': [],
        'a11y_empty_alt': [],
        'perf_will_change': [],
        'theme_hardcoded_colors': [],
        'resp_fixed_widths': []
    }

    base = 'frontend/src/components'
    for root, _, files in os.walk(base):
        for f in files:
            if not f.endswith('.tsx') and not f.endswith('.jsx'): continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as file:
                try:
                    content = file.read()
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        line_num = i + 1
                        
                        # Images missing alt entirely (heuristic: <img but no alt)
                        if '<img ' in line and 'alt=' not in line and '{...' not in line:
                            results['a11y_missing_alt'].append(f"{path}:{line_num}")
                        
                        # Empty alt
                        if 'alt=""' in line or "alt={''}" in line:
                            results['a11y_empty_alt'].append(f"{path}:{line_num}")
                            
                        # will-change
                        if 'will-change' in line:
                            results['perf_will_change'].append(f"{path}:{line_num}")
                            
                        # Hardcoded hex colors (ignoring #fff or #000 maybe, let's just find them all)
                        if re.search(r'#[0-9a-fA-F]{3,6}\b', line):
                            # Ensure it's not a url anchor #
                            if not re.search(r'href=["\']#', line):
                                results['theme_hardcoded_colors'].append(f"{path}:{line_num}")
                                
                        # Fixed px widths or heights in style or className that are large
                        # Tailwind: w-[200px], h-[300px]
                        if re.search(r'\b[wh]-\[[0-9]+px\]', line):
                            results['resp_fixed_widths'].append(f"{path}:{line_num}")

                except Exception as e:
                    pass

    for key, val in results.items():
        print(f"=== {key} ({len(val)}) ===")
        for v in val[:5]: print(v)
        if len(val) > 5: print("...")

scan()
