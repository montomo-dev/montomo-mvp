import{MONSTER_ART_BOX}from'./data/monsterArt.js';
import{MONSTER_ATLASES,PLAYER_ATLAS}from'./data/generatedArt.js';
import{partitionAtlas,extractAtlasPixels}from'./atlas.js';
export const APPROVED_ART_SPECIES=new Set(MONSTER_ATLASES.flatMap(a=>a.species));
export function isNearlySolidMagenta(pixels,threshold=.9){let visible=0,magenta=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i+3]<16)continue;visible++;if(pixels[i]>=200&&pixels[i+1]<=90&&pixels[i+2]>=180)magenta++}return visible>0&&magenta/visible>=threshold}
const cache=new Map();
function loadAtlas(def){
  if(typeof Image==='undefined'||typeof document==='undefined')return null;
  if(cache.has(def.path))return cache.get(def.path);
  const entry={state:'loading',image:new Image(),tiles:new Map(),error:null};cache.set(def.path,entry);
  entry.image.addEventListener('load',()=>{
    try{
      const c=document.createElement('canvas');c.width=entry.image.naturalWidth;c.height=entry.image.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(entry.image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;
      if(isNearlySolidMagenta(pixels))throw Error('画像の背景を確認してください。');
      const partition=partitionAtlas(pixels,c.width,c.height,def.columns,def.rows,def.species.length);
      def.species.forEach((id,index)=>{
        const raw=extractAtlasPixels(pixels,c.width,partition,index),tile=document.createElement('canvas');tile.width=raw.width;tile.height=raw.height;
        tile.getContext('2d').putImageData(new ImageData(raw.data,raw.width,raw.height),0,0);entry.tiles.set(id,tile);
      });
      // 図鑑で全種類を見ても、原画の画素配列・ラベルを永久保持しない。
      c.width=1;c.height=1;entry.image=null;entry.state='ready';
    }catch(error){entry.state='rejected';entry.error=error.message;console.error('モンとも: 画像を読み込めません',def.path,entry.error)}
  });
  entry.image.addEventListener('error',()=>{entry.state='rejected';entry.error='画像ファイルを開けません。';console.error('モンとも: 画像ファイルを開けません',def.path)});
  entry.image.src=def.path;return entry;
}
function tileFor(def,id){
  const entry=loadAtlas(def);if(!entry||entry.state!=='ready')return null;
  return entry.tiles.get(id)??null;
}
export function drawMonsterArt(ctx,id){
  const def=MONSTER_ATLASES.find(a=>a.species.includes(id));if(!def)return false;
  const tile=tileFor(def,id);if(!tile)return false;
  const fit=(MONSTER_ART_BOX[id]??90)/Math.max(tile.width,tile.height),w=tile.width*fit,h=tile.height*fit;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,-w/2,28-h,w,h);ctx.restore();return true;
}
export function drawPlayerArt(ctx,facing){
  const tile=tileFor(PLAYER_ATLAS,['down','right','up','left'].includes(facing)?facing:'down');if(!tile)return false;
  const fit=38/tile.height,w=tile.width*fit;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,-w/2,-22,w,38);ctx.restore();return true;
}
export function artStatus(){return Array.from(cache,([path,a])=>({path,state:a.state,error:a.error}))}
