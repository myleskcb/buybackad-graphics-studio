"""The contact sheet, in the export's own grid: 5 columns of 320px, 12px gaps."""
import glob
from common import *
files = sorted(glob.glob(OUT + '/social/*.jpg'))
cell, gap, cols = 320, 12, 5
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cell + (cols + 1) * gap, rows * cell + (rows + 1) * gap), (24, 23, 28))
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((cell, cell), Image.LANCZOS)
    sheet.paste(im, (gap + (i % cols) * (cell + gap), gap + (i // cols) * (cell + gap)))
sheet.save(OUT + '/sheet-social.jpg', quality=90)
print('sheet', sheet.size, len(files), 'cards')
