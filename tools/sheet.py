import glob,sys
from PIL import Image, ImageDraw
d=sys.argv[1]; fs=sorted(glob.glob(d+'/f*.jpg')); n=int(sys.argv[2]) if len(sys.argv)>2 else 6
ims=[Image.open(f).resize((240,427)) for f in fs]
rows=(len(ims)+n-1)//n; W=Image.new('RGB',(240*n,427*rows),'white')
for i,im in enumerate(ims):
    ImageDraw.Draw(im).text((4,4),fs[i].split('/')[-1][1:5],fill='red'); W.paste(im,((i%n)*240,(i//n)*427))
W.save(d+'/sheet.jpg',quality=85)
