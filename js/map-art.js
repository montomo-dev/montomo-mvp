const frames = {
  oak:0, cedar:1, mushroom:2, coral:3, fir:4, cactus:5, boiler:6, column:7,
  rock:8, tent:9, shop:10, inn:11, spring:12, shrine:13, trail:14, village:15,
};
let atlas=null, ground=null, flora=null, floraReady=false, ready=false, groundReady=false, revision=0;
if(typeof Image==='function'){
  atlas=new Image();
  atlas.onload=()=>{ready=true;revision++;};
  atlas.src=new URL('../assets/maps/environment.png',import.meta.url).href;
  ground=new Image();
  ground.onload=()=>{groundReady=true;revision++;};
  ground.src=new URL('../assets/maps/terrain.png',import.meta.url).href;
  flora=new Image();flora.onload=()=>{floraReady=true;revision++;};
  flora.src=new URL('../assets/maps/flora.png',import.meta.url).href;
}
export function drawMapArt(ctx,name,x,baseY,width,height=width){
  if(!ready||frames[name]===undefined)return false;
  const cell=atlas.width/4,index=frames[name];
  ctx.drawImage(atlas,index%4*cell,Math.floor(index/4)*cell,cell,cell,Math.round(x-width/2),Math.round(baseY-height),Math.round(width),Math.round(height));
  return true;
}

export function mapArtRevision(){return revision;}
export function drawMapGround(c,s,width,height){
  if(!groundReady)return false;
  const index=s.stage.townExitStage?6:s.stageId==='cave'||s.stageId.endsWith('_cave')?7:({forest:0,reverse:1,sea:2,snow:3,desert:4,factory:5,castle:6}[s.world]??0);
  const size=ground.width/4,tile=192;
  c.save();c.globalAlpha=s.stage.townExitStage ? .35 : index===7 ? .7 : .84;
  for(let y=0;y<height;y+=tile)for(let x=0;x<width;x+=tile){
    const flipX=x/tile%2,flipY=y/tile%2;
    c.save();c.translate(x+(flipX?tile:0),y+(flipY?tile:0));c.scale(flipX?-1:1,flipY?-1:1);
    c.drawImage(ground,index%4*size,Math.floor(index/4)*size,size,size,0,0,tile,tile);c.restore();
  }
  c.restore();return true;
}

export function drawEncounterArt(c,s,x,baseY){
  if(!floraReady)return false;
  const index=s.stageId==='cave'||s.stageId.endsWith('_cave')?7:({forest:0,reverse:1,sea:2,snow:3,desert:4,factory:5,castle:6}[s.world]??0),cell=flora.width/4;
  c.drawImage(flora,index%4*cell,Math.floor(index/4)*cell,cell,cell,Math.round(x-45),Math.round(baseY-90),90,90);
  return true;
}
