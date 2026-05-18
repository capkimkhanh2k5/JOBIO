import os

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Apply patches
    new_content = content.replace("len(response.data)", "len(response.data.get('results', response.data) if isinstance(response.data, dict) else response.data)")
    new_content = new_content.replace("for item in response.data:", "for item in (response.data.get('results', response.data) if isinstance(response.data, dict) else response.data):")
    new_content = new_content.replace("response.data[0]", "(response.data.get('results', response.data) if isinstance(response.data, dict) else response.data)[0]")
    new_content = new_content.replace("response.data[1]", "(response.data.get('results', response.data) if isinstance(response.data, dict) else response.data)[1]")
    new_content = new_content.replace("for c in response.data", "for c in (response.data.get('results', response.data) if isinstance(response.data, dict) else response.data)")
    new_content = new_content.replace("for p in response.data", "for p in (response.data.get('results', response.data) if isinstance(response.data, dict) else response.data)")
    new_content = new_content.replace("for s in response.data", "for s in (response.data.get('results', response.data) if isinstance(response.data, dict) else response.data)")
    new_content = new_content.replace("for j in response.data", "for j in (response.data.get('results', response.data) if isinstance(response.data, dict) else response.data)")

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Patched {filepath}")

for root, _, files in os.walk('apps'):
    if 'tests' in root:
        for file in files:
            if file.startswith('test_') and file.endswith('.py'):
                patch_file(os.path.join(root, file))

