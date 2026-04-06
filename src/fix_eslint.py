import os

files_to_fix = {
    'G:/gradProjectFront/laundry/src/app/pages/Home.tsx': {
        531: [('"', '&quot;')]
    },
    'G:/gradProjectFront/laundry/src/app/pages/OrderDetailsNew.tsx': {
        147: [("'", "&apos;")],
        165: [("'", "&apos;")],
        183: [("'", "&apos;")],
        220: [("'", "&apos;")]
    },
    'G:/gradProjectFront/laundry/src/app/pages/OrderPage.tsx': {
        39: [('[]', '[router]')]
    },
    'G:/gradProjectFront/laundry/src/app/pages/Payment.tsx': {
        199: [("'", "&apos;")]
    },
    'G:/gradProjectFront/laundry/src/app/pages/RateLaundry.tsx': {
        195: [("'", "&apos;")]
    },
    'G:/gradProjectFront/laundry/src/app/pages/Refer.tsx': {
        38: [("'", "&apos;")]
    },
    'G:/gradProjectFront/laundry/src/app/pages/RinseRepeat.tsx': {
        28: [("'", "&apos;")]
    },
    'G:/gradProjectFront/laundry/src/app/pages/Schedule.tsx': {
        25: [("'", "&apos;")]
    },
    'G:/gradProjectFront/laundry/src/app/pages/Services.tsx': {
        115: [("'", "&apos;")],
        133: [("'", "&apos;")]
    },
    'G:/gradProjectFront/laundry/src/app/pages/SignupPage.tsx': {
        216: [("'", "&apos;")],
        297: [("'", "&apos;")]
    },
    'G:/gradProjectFront/laundry/src/app/pages/TrackOrder.tsx': {
        184: [("'", "&apos;")],
        198: [("'", "&apos;")],
        346: [('"', '&quot;')]
    }
}

for filepath, line_fixes in files_to_fix.items():
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line_num, replacements in line_fixes.items():
        idx = line_num - 1
        if idx < len(lines):
            for old, new in replacements:
                # If it's the missing dependency error, just replace the exact text
                if old == '[]' and new == '[router]':
                    lines[idx] = lines[idx].replace('[]', '[router]')
                else:
                    lines[idx] = lines[idx].replace(old, new)
                    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"Fixed {filepath}")
