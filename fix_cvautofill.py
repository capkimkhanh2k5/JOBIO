import re
path = 'frontend/src/components/profile/CVAutoFillDialog.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'onDrop=\{handleDrop\}\n\s*onClick=\{\(\) => fileInputRef\.current\?\.click\(\)\}',
    r'onDrop={handleDrop}\n                                    role="button"\n                                    tabIndex={0}\n                                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}\n                                    onClick={() => fileInputRef.current?.click()}',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
