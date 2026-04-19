import re
from collections import defaultdict

with open('test_output.txt', 'r') as f:
    content = f.read()

failures = re.findall(r'^(?:ERROR|FAIL): [a-zA-Z0-9_]+ \(([\w\.]+)\)', content, re.MULTILINE)
groups = defaultdict(int)
for f in failures:
    groups[f] += 1

for k, v in sorted(groups.items()):
    print(f"{v:3d} {k}")
