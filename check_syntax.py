import os

app_dir = "/Users/dhinagar/Documents/antigravity/Fitly/mobile"

target_dirs = ['app', 'components', 'constants', 'services', 'store']
files = []
for d in target_dirs:
    dp = os.path.join(app_dir, d)
    for root, _, filenames in os.walk(dp):
        for fn in filenames:
            if fn.endswith('.js') or fn.endswith('.jsx'):
                files.append(os.path.join(root, fn))

print(f"Scanning {len(files)} source files...")
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    curly = content.count('{') - content.count('}')
    paren = content.count('(') - content.count(')')
    bracket = content.count('[') - content.count(']')
    if curly != 0 or paren != 0 or bracket != 0:
        print(f"MISMATCH in {fpath}: {{: {curly}, (): {paren}, []: {bracket}")
print("Scan complete!")
