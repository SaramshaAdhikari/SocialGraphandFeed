import re, os, glob

files_to_analyze = [
    r'packages/backend/src/services/PostService.ts',
    r'packages/backend/src/services/FeedService.ts',
    r'packages/backend/src/services/UserService.ts',
    r'packages/backend/src/services/AuthService.ts',
    r'packages/backend/src/services/CommunityService.ts',
    r'production-server.mjs',
    r'packages/frontend/src/pages/GraphPage.tsx',
    r'packages/frontend/src/pages/CreatePostPage.tsx'
]

results = []

for rel_path in files_to_analyze:
    full_path = os.path.join(r'C:\Users\saram\Projects\SocialGraphandFeed_Testing', rel_path)
    if not os.path.exists(full_path):
        continue
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    loc = len(content.splitlines())
    # Count decision branches for McCabe cyclomatic complexity:
    branches = len(re.findall(r'\b(if|else\s+if|for|while|case|catch)\b', content))
    logical_ops = len(re.findall(r'(&&|\|\||\?\s*[^:])', content))
    complexity = 1 + branches + logical_ops
    
    results.append({
        'file': os.path.basename(rel_path),
        'path': rel_path,
        'loc': loc,
        'branches': branches,
        'logical_ops': logical_ops,
        'complexity': complexity,
        'rating': 'Low (Simple)' if complexity <= 10 else ('Moderate' if complexity <= 25 else 'High (Complex)')
    })

print(f"{'File':<25} | {'LOC':<6} | {'Branches':<8} | {'Complexity':<10} | {'Rating'}")
print("-" * 65)
for r in results:
    print(f"{r['file']:<25} | {r['loc']:<6} | {r['branches']:<8} | {r['complexity']:<10} | {r['rating']}")
