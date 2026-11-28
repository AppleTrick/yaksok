"""두 캡처 폴더를 픽셀 단위로 비교한다. 사용: python visual_diff.py <기준 폴더> <새 폴더> [<차이 이미지 폴더>]"""
import os, sys
from PIL import Image, ImageChops

sys.stdout.reconfigure(encoding='utf-8')
a, b = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else None
if out:
    os.makedirs(out, exist_ok=True)
changed = 0
for n in sorted(set(os.listdir(a)) | set(os.listdir(b))):
    if not n.endswith('.png'):
        continue
    if n not in os.listdir(a) or n not in os.listdir(b):
        print(f'{n:34} 한쪽에만 있음'); changed += 1; continue
    x, y = Image.open(os.path.join(a, n)).convert('RGB'), Image.open(os.path.join(b, n)).convert('RGB')
    if x.size != y.size:
        print(f'{n:34} 크기 다름 {x.size} → {y.size}'); changed += 1; continue
    d = ImageChops.difference(x, y)
    box = d.getbbox()
    px = sum(1 for v in (d.convert("L").get_flattened_data() if hasattr(d.convert("L"), "get_flattened_data") else d.convert("L").getdata()) if v > 8) if box else 0
    if px:
        changed += 1
        print(f'{n:34} 바뀐 픽셀 {px:7} ({px / (x.width * x.height):.2%}) 영역 {box}')
        if out:
            Image.blend(x, Image.new('RGB', x.size, (255, 0, 0)), 0).paste((255, 0, 0), mask=d.convert('L').point(lambda v: 255 if v > 8 else 0))
            m = y.copy(); m.paste((255, 0, 60), mask=d.convert('L').point(lambda v: 255 if v > 8 else 0)); m.save(os.path.join(out, n))
print('달라진 화면', changed)
