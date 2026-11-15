import{BACKGROUND_ATLAS}from'./data/generatedArt.js';
const order=['forest','reverse','sea','snow','desert','factory','castle','title'];let image=null;
function draw(ctx,key){
  if(typeof Image==='undefined')return false;if(!image){image=new Image();image.src=BACKGROUND_ATLAS.path}
  if(!image.complete||!image.naturalWidth)return false;
  const i=Math.max(0,order.indexOf(key)),w=image.naturalWidth/2,h=image.naturalHeight/4;
  // 小さな境界の揺れを画面へ混ぜないよう、各背景の端を約2%だけ画角から外す。
  const padX=w*.018,padY=h*.027;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,(i%2)*w+padX,Math.floor(i/2)*h+padY,w-padX*2,h-padY*2,0,0,640,480);ctx.restore();return true;
}
export function drawBattleBackground(ctx,world){return draw(ctx,order.includes(world)?world:'forest')}
export function drawTitleBackground(ctx){
  if(draw(ctx,'title'))return true;ctx.save();const g=ctx.createLinearGradient(0,0,0,480);g.addColorStop(0,'#a8d4e2');g.addColorStop(.55,'#669560');g.addColorStop(1,'#16392f');ctx.fillStyle=g;ctx.fillRect(0,0,640,480);ctx.restore();return true;
}
