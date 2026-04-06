import os
import re

def fix_framer_motion_ease(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace [0.22, 1, 0.36, 1] with [0.22, 1, 0.36, 1] as const
    # using regex for safety
    content = re.sub(r'ease:\s*\[([\d\.\s,]+)\](?! as)', r'ease: [\1] as const', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_framer_motion_ease('G:/gradProjectFront/laundry/src/app/pages/Home.tsx')
fix_framer_motion_ease('G:/gradProjectFront/laundry/src/app/(app)/layout.tsx')

def fix_static_image_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # ImageWithFallback.tsx
    if "export function ImageWithFallback" in content and "StaticImageData" not in content:
        content = "import { StaticImageData } from 'next/image';\n" + content
        # Change `src` to accept both string and StaticImageData
        content = content.replace('export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {', """export interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | StaticImageData;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {""")
        content = content.replace('const { src, alt, style, className, ...rest } = props', """const { src, alt, style, className, ...rest } = props
  const actualSrc = typeof src === 'string' ? src : src?.src""")
        content = content.replace('data-original-url={src}', 'data-original-url={actualSrc}')
        content = content.replace('src={src}', 'src={actualSrc}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_static_image_data('G:/gradProjectFront/laundry/src/app/components/figma/ImageWithFallback.tsx')

def fix_laundry_interface(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if "export interface Laundry" in content and "StaticImageData" not in content:
        content = "import { StaticImageData } from 'next/image';\n" + content
        content = content.replace('image: string;', 'image: string | StaticImageData;')
        content = content.replace('isAvailable: boolean;', 'isAvailable: boolean;\n  category?: string;')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_laundry_interface('G:/gradProjectFront/laundry/src/app/data/laundries.ts')
