import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Replace <Link to= with <Link href=
    content = re.sub(r'<Link\s+to=', '<Link href=', content)
    content = re.sub(r'<Link\s+([^>]*)to=', r'<Link \1href=', content)

    # Process imports for react-router
    match = re.search(r'import\s+\{([^}]+)\}\s+from\s+[\'\"`]react-router[\'\"`];?', content)
    if match:
        imports_str = match.group(1)
        imports = [i.strip() for i in imports_str.split(',')]
        
        new_imports = []
        if 'Link' in imports:
            new_imports.append("import Link from 'next/link';")
            imports.remove('Link')
        
        next_nav_imports = []
        for i in imports:
            if i == 'useNavigate':
                next_nav_imports.append('useRouter')
            elif i == 'useLocation':
                next_nav_imports.append('usePathname')
                next_nav_imports.append('useSearchParams')
            elif i == 'useParams':
                next_nav_imports.append('useParams')
            elif i == 'useSearchParams':
                next_nav_imports.append('useSearchParams')
            elif i == 'Outlet':
                # Outlet isn't used in App Router the same way, we'll just ignore or remove it 
                # layout.tsx usually takes `{children}`
                pass
            elif i == 'RouterProvider':
                pass
            
        if next_nav_imports:
            # remove duplicates
            next_nav_imports = list(dict.fromkeys(next_nav_imports))
            new_imports.append(f"import {{ {', '.join(next_nav_imports)} }} from 'next/navigation';")
        
        original_import = match.group(0)
        content = content.replace(original_import, '\n'.join(new_imports))
        
        # Replace usages:
        content = re.sub(r'const\s+navigate\s*=\s*useNavigate\(\);?', 'const router = useRouter();', content)
        content = re.sub(r'navigate\(', 'router.push(', content)
        content = re.sub(r'router\.push\(-1\)', 'router.back()', content)
        content = re.sub(r'const\s+location\s*=\s*useLocation\(\);?', 'const pathname = usePathname();\n  const searchParams = useSearchParams();', content)
        # Fix location.state used in Login.tsx
        content = re.sub(r'location\.state', '{}', content) 

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Processed {filepath}')

for root, dirs, files in os.walk('G:\\gradProjectFront\\laundry\\src\\app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
