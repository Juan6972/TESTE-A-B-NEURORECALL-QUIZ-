"""Generate responsive product images without changing their artwork.
Run with Python 3 and Pillow (WebP and AVIF encoders required).
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
output = root / 'public/images'
output.mkdir(exist_ok=True)
for source in sorted((root / 'assets/source-images').glob('*.png')):
    with Image.open(source) as original:
        for width in (256, 512, 768):
            height = round(original.height * width / original.width)
            resized = original.resize((width, height), Image.Resampling.LANCZOS)
            for extension, options in (
                ('webp', {'quality': 84, 'method': 6}),
                ('avif', {'quality': 70, 'speed': 6}),
            ):
                target = output / f'{source.stem}-{width}.{extension}'
                resized.save(target, **options)
                print(f'{target.name}: {target.stat().st_size:,} bytes')
