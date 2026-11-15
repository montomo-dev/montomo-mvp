import{drawMonsterArt,drawPlayerArt}from'./artwork.js';
// 新素材の読み込み中も位置が分かる小さな輪郭。旧画像・旧キャラクター絵は参照しない。
function waiting(ctx,r=13){ctx.fillStyle='#648c65';ctx.strokeStyle='#16392f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f7f6dc';ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.fillText('…',0,4)}
export function drawMonster(ctx,id,cx,cy,scale=1,t=0,hueRotate=0){
  ctx.save();ctx.fillStyle='rgba(13,33,30,.17)';ctx.beginPath();ctx.ellipse(cx,cy+36*scale,29*scale,7*scale,0,0,Math.PI*2);ctx.fill();
  ctx.translate(cx,cy+Math.sin(t*3)*2.2*scale);ctx.scale(scale*1.12,scale*1.12);if(hueRotate)ctx.filter=`hue-rotate(${hueRotate}deg) saturate(1.15)`;
  if(!drawMonsterArt(ctx,id))waiting(ctx);ctx.restore();
}
export function drawCompanion(ctx,monster,x,y,facing,t=0){
  if(!monster?.speciesId)return;const offsets={up:[18,18],down:[-18,-20],left:[18,-14],right:[-18,-14]},[dx,dy]=offsets[facing]??offsets.down;
  drawMonster(ctx,monster.speciesId,x+dx,y+dy+Math.sin(t*5+(monster.uid??0))*.9,.38,t+(monster.uid??0)*.37);
  if(Math.sin(t*1.4+(monster.uid??0))>.96){ctx.save();ctx.fillStyle='#edb765';ctx.beginPath();ctx.arc(x+dx+13,y+dy-27,2.7,0,Math.PI*2);ctx.fill();ctx.restore()}
}
export function drawPlayer(ctx,x,y,facing,t=0){
  ctx.save();ctx.fillStyle='rgba(13,33,30,.2)';ctx.beginPath();ctx.ellipse(x,y+16,11,3.5,0,0,Math.PI*2);ctx.fill();ctx.translate(x,y+Math.sin(t*6)*1.1);
  if(!drawPlayerArt(ctx,facing))waiting(ctx,10);ctx.restore();
}
