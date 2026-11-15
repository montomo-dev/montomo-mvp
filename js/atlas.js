// 原画像を編集せず、透過アトラスの連結した輪郭をゲーム内で取り出す。
// 均等セルを少し越える羽・触角も、同じ連結成分なら切り落とさない。
export function partitionAtlas(pixels,width,height,columns,rows,count=columns*rows){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||pixels.length!==width*height*4)throw Error('画像の寸法が不正です。');
  if(count<1||count>columns*rows)throw Error('アトラスの種類数が不正です。');
  const total=width*height,labels=new Uint32Array(total),queue=new Uint32Array(total),components=[null];
  for(let start=0;start<total;start++){
    if(labels[start]||pixels[start*4+3]<8)continue;
    const id=components.length;let head=0,tail=1,n=0,sx=0,sy=0,minX=width,minY=height,maxX=0,maxY=0;queue[0]=start;labels[start]=id;
    while(head<tail){
      const p=queue[head++],x=p%width,y=Math.floor(p/width);n++;sx+=x;sy+=y;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if((!dx&&!dy)||x+dx<0||x+dx>=width||y+dy<0||y+dy>=height)continue;
        const q=p+dy*width+dx;if(!labels[q]&&pixels[q*4+3]>=8){labels[q]=id;queue[tail++]=q}
      }
    }
    components.push({id,n,x:sx/n,y:sy/n,minX,minY,maxX,maxY});
  }
  const primary=Array(count).fill(null);
  for(const c of components.slice(1)){
    if(c.n<4)continue;
    const col=Math.min(columns-1,Math.floor(c.x/width*columns)),row=Math.min(rows-1,Math.floor(c.y/height*rows)),cell=row*columns+col;
    if(cell<count&&(!primary[cell]||primary[cell].n<c.n))primary[cell]=c;
  }
  if(primary.some(c=>!c||c.n<4))throw Error('画像内のキャラクターの区切りを確認してください。');
  const owners=new Uint8Array(components.length).fill(255),bounds=primary.map(c=>({...c}));
  for(const c of components.slice(1)){
    if(c.n<4)continue;
    let best=0,score=Infinity;
    primary.forEach((p,i)=>{
      const dx=Math.max(p.minX-c.x,0,c.x-p.maxX),dy=Math.max(p.minY-c.y,0,c.y-p.maxY);
      const distance=dx*dx+dy*dy+.03*((p.x-c.x)**2+(p.y-c.y)**2);
      if(distance<score){score=distance;best=i}
    });
    owners[c.id]=best;const b=bounds[best];b.minX=Math.min(b.minX,c.minX);b.minY=Math.min(b.minY,c.minY);b.maxX=Math.max(b.maxX,c.maxX);b.maxY=Math.max(b.maxY,c.maxY);
  }
  return{labels,owners,bounds};
}

export function extractAtlasPixels(pixels,width,partition,index){
  const b=partition.bounds[index];if(!b)throw Error('画像の種類が見つかりません。');
  const w=b.maxX-b.minX+1,h=b.maxY-b.minY+1,data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const src=(y+b.minY)*width+x+b.minX,label=partition.labels[src];
    if(label&&partition.owners[label]===index)data.set(pixels.subarray(src*4,src*4+4),(y*w+x)*4);
  }
  return{width:w,height:h,data};
}
