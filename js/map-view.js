import {drawPlayer} from './sprites.js';
import {drawMapArt,drawMapGround,drawEncounterArt,mapArtRevision} from './map-art.js';
import {tr} from './i18n.js';
import {mapTheme,themeContext} from './map-themes.js';
function polygon(c,color,points){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
export const MAP_CELL = 72;
const WIDTH = 640, HEIGHT = 480;
export const FIELD_TOP = 96;
export function worldTilePosition(x,y) { return {x:x*MAP_CELL+(MAP_CELL-40)/2,y:y*MAP_CELL+(MAP_CELL-40)/2}; }
export function mapCamera(scene) {
  const width=scene.map[0].length*MAP_CELL,height=scene.map.length*MAP_CELL;
  const viewHeight=HEIGHT-FIELD_TOP;
  return {x:Math.round(Math.max(0,Math.min(width-WIDTH,(scene.player.x+.5)*MAP_CELL-WIDTH*.5))),
    y:Math.round(Math.max(0,Math.min(height-viewHeight,(scene.player.y+.5)*MAP_CELL-viewHeight*.53))),
    width:WIDTH,height:viewHeight,top:FIELD_TOP,mapWidth:width,mapHeight:height};
}
function makeCanvas(width,height) {
  try {
    const c=typeof OffscreenCanvas==='function'?new OffscreenCanvas(width,height):globalThis.document?.createElement?.('canvas');
    if(!c||typeof c.getContext!=='function')return null;
    c.width=width;c.height=height;return c.getContext('2d')?c:null;
  }catch{return null;}
}

const mix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
const key=(x,y)=>`${x},${y}`;
const hash=(x,y)=>((x*73856093)^(y*19349663))>>>0;
const DESTINATIONS=[3,4,5,6,7,8,12,13,14];

export class MapView {
  constructor(){this.stage=null;this.ground=null;this.obstacles=[];this.buildings=[];}
  prepare(scene) {
    if(this.stage===scene.stage&&this.artRevision===mapArtRevision())return;
    this.artRevision=mapArtRevision();
    this.stage=scene.stage;this.paths=scene.mapGuidePaths();this.theme=mapTheme(scene);this.ground=null;this.obstacles=[];
    for(let y=0;y<scene.map.length;y++)for(let x=0;x<scene.map[y].length;x++)if(scene.map[y][x]===2)
      this.obstacles.push({x:x*MAP_CELL,y:y*MAP_CELL,gx:x,gy:y});
    this.buildings=this.groupBuildings(scene.map);
    const image=makeCanvas(scene.map[0].length*MAP_CELL,scene.map.length*MAP_CELL);
    if(image){this.drawFloor(image.getContext('2d'),scene);this.ground=image;}
  }
  groupBuildings(map) {
    const seen=new Set(),buildings=[];
    for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++)if(map[y][x]===10&&!seen.has(key(x,y))){
      const cells=[{x,y}];seen.add(key(x,y));
      for(let i=0;i<cells.length;i++)for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
        const nx=cells[i].x+dx,ny=cells[i].y+dy;
        if(map[ny]?.[nx]===10&&!seen.has(key(nx,ny))){seen.add(key(nx,ny));cells.push({x:nx,y:ny});}
      }
      const left=Math.min(...cells.map(p=>p.x)),right=Math.max(...cells.map(p=>p.x)),top=Math.min(...cells.map(p=>p.y)),bottom=Math.max(...cells.map(p=>p.y));
      const size=Math.min((right-left+1)*MAP_CELL*.62,(bottom-top+1)*MAP_CELL*.62);
      buildings.push({x:(left+(right-left+1)/2)*MAP_CELL-size/2,y:(bottom+1)*MAP_CELL-size,t:size,cells});
    }
    return buildings;
  }
  drawFloor(c,s) {
    const p=this.theme,T=MAP_CELL,w=s.map[0].length*T,h=s.map.length*T;
    rect(c,p.floor[0],0,0,w,h);
    const painted=drawMapGround(c,s,w,h);
    for(let y=0;y<s.map.length;y++)for(let x=0;x<s.map[y].length;x++){
      const n=hash(x,y),px=x*T,py=y*T,type=s.map[y][x];
      if(!painted){
      if(p.texture==='plate'||p.texture==='stone'){
        const edge=mix(p.floor[0],p.dark,.25),light=mix(p.floor[0],p.fleck,.23);
        for(let j=0;j<3;j++){
          const by=py+j*24,off=(y*3+j)%2?18:0;
          rect(c,edge,px,by+22,T,2);rect(c,light,px,by,T,1);
          for(let i=off;i<T;i+=36){rect(c,edge,px+i,by,1,23);if(p.texture==='plate')rect(c,p.fleck,px+i+4,by+4,2,2);}
        }
        if(p.cave&&n%4===0)polygon(c,p.dark,[[px+12,py+26],[px+26,py+32],[px+23,py+44],[px+24,py+33]]);
      }else{
        for(let j=0;j<24;j++){
          const a=hash(x*31+j,y*19+j),dx=px+2+a%68,dy=py+2+(a>>>8)%68;
          const color=j%4===0?mix(p.floor[0],p.fleck,.42):mix(p.floor[0],p.dark,.13);
          if(p.texture==='water'){
            rect(c,color,dx,dy,5+a%13,1);if(j%5===0)rect(c,p.floor[2],dx+5,dy+2,13,1);
          }else if(p.texture==='sand'){
            if(j%3===0){rect(c,color,dx,dy,9+a%8,1);rect(c,p.floor[2],dx+4,dy+3,7,1);}
          }else{
            rect(c,color,dx,dy,2,2+a%3);if(j%5===0)rect(c,color,dx-2,dy+2,6,1);
          }
        }
      }
      }
      if(type===2||type===10){
        c.fillStyle=p.dark+'28';c.beginPath();c.ellipse(px+39,py+56,43,24,-.15,0,Math.PI*2);c.fill();
        for(let j=0;j<7;j++){
          const a=hash(x+j,y*3+j);rect(c,p.plant[0],px+6+a%61,py+19+(a>>>8)%43,3,5);
        }
      }
      if(type===1)this.encounterPlant(c,px,py,T,n,s);
      if(type===0&&!this.paths.has(key(x,y))&&n%9===0){
        const tint=p.texture==='snow'?'#f3f4db':s.world==='reverse'?'#d4a4db':s.world==='sea'?'#e7b6a0':'#f0d38a';
        for(let j=0;j<3;j++){
          const fx=px+17+(n+j*17)%38,fy=py+20+(n+j*23)%34;
          rect(c,p.plant[0],fx,fy,2,5);rect(c,tint,fx-2,fy-2,6,3);rect(c,p.fleck,fx,fy-3,2,2);
        }
      }
    }
    const road=(x,y)=>this.paths.has(key(x,y))||DESTINATIONS.includes(s.map[y]?.[x]);
    c.lineCap='round';c.lineJoin='round';
    for(const [width,color] of [[35,mix(p.path,p.dark,.26)],[31,p.path],[25,mix(p.path,p.fleck,.17)]]){
      c.strokeStyle=color;c.lineWidth=width;c.beginPath();
      for(let y=0;y<s.map.length;y++)for(let x=0;x<s.map[y].length;x++){
        if(!road(x,y))continue;
        const px=(x+.5)*T,py=(y+.5)*T;
        c.moveTo(px-.5,py);c.lineTo(px+.5,py);
        for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])if(road(x+dx,y+dy)){c.moveTo(px,py);c.lineTo(px+dx*T/2,py+dy*T/2);}
      }
      c.stroke();
    }
    for(let y=0;y<s.map.length;y++)for(let x=0;x<s.map[y].length;x++){
      if(!road(x,y))continue;
      const px=(x+.5)*T,py=(y+.5)*T;
      for(let j=0;j<6;j++){
        const n=hash(x*7+j,y*9+j),dx=px-12+n%24,dy=py-12+(n>>>7)%24;
        rect(c,j%2?mix(p.path,p.dark,.15):p.fleck,dx,dy,3+n%4,1+(n%3===0));
      }
    }
    c.lineCap='butt';
  }
  encounterPlant(c,x,y,t,n,s) {
    if(drawEncounterArt(c,s,x+t/2,y+t-5))return;
    const p=this.theme;
    const ground=mix(p.floor[0],p.plant[0],.48);
    polygon(c,ground,[[x+8,y+17],[x+28,y+10],[x+57,y+14],[x+66,y+37],[x+61,y+61],[x+31,y+66],[x+7,y+54],[x+3,y+32]]);
    for(let j=0;j<20;j++){
      const a=hash(n+j,j*13),fx=x+10+a%51,fy=y+18+(a>>>8)%42,ht=5+a%7;
      polygon(c,j%3===0?p.plant[2]:p.plant[1],[[fx-3,fy+4],[fx-4,fy-ht+2],[fx,fy-1],[fx+3,fy-ht],[fx+2,fy+5]]);
      rect(c,p.plant[0],fx+1,fy+2,2,4);
    }
    if(s.world==='forest'||s.world==='reverse')for(let j=0;j<4;j++){
      const fx=x+18+(n+j*17)%39,fy=y+22+(n+j*19)%35;
      rect(c,j%2?'#f5d88b':p.fleck,fx-2,fy-3,5,3);rect(c,p.plant[0],fx,fy+1,1,4);
    }
  }
  obstacle(c,x,y,t,n) {
    const themed=themeContext(c,this.theme);
    if(this.theme.obstacle==='tree')this.tree(themed,x,y,t,n);
    else if(this.theme.obstacle==='cactus'){c.save();c.translate(x,y);c.scale(t/40,t/40);this.cactus(themed,0,0);c.restore();}
    else if(this.theme.obstacle==='rock'){c.save();c.translate(x,y);c.scale(t/40,t/40);this.rock(themed,0,0);c.restore();}
    else this.shrine.call({marker(){}},themed,x,y-t*.28,t,false);
  }
  draw(c,s,actors=[]) {
    this.prepare(s);if(this.ground)c.drawImage(this.ground,0,0);else this.drawFloor(c,s);
    s.drawTreasures(c);s.drawGroundItems(c);
    const camera=mapCamera(s),entities=actors.slice();
    const visible=(x,y,w,h)=>x+w>=camera.x&&x<=camera.x+camera.width&&y+h>=camera.y&&y<=camera.y+camera.height;
    for(const item of this.obstacles){
      if(!visible(item.x-30,item.y-75,132,155))continue;
      entities.push({y:item.y+MAP_CELL*.82,draw:()=>{
        const n=hash(item.gx,item.gy),name=this.theme.cave?'rock':({forest:n%4===0?'cedar':'oak',reverse:'mushroom',sea:'coral',snow:'fir',desert:'cactus',factory:'boiler',castle:'column'}[s.world]||'oak');
        const size=name==='rock'?104:name==='column'?119:123+n%9;
        if(!drawMapArt(c,name,item.x+MAP_CELL/2+(n%7-3),item.y+MAP_CELL+14+(n>>>4)%9,size,size))this.obstacle(c,item.x,item.y,MAP_CELL,n%2);
      }});
    }
    for(const b of this.buildings)if(visible(b.x-32,b.y-65,b.t+64,b.t+80))entities.push({y:b.y+b.t*.9,draw:()=>{
      if(!drawMapArt(c,'inn',b.x+b.t/2,b.y+b.t+18,b.t*1.65))this.camp.call({marker(){}},themeContext(c,this.theme),b.x,b.y,b.t);
    }});
    for(let y=0;y<s.map.length;y++)for(let x=0;x<s.map[y].length;x++){
      const type=s.map[y][x];if(type<=2||type===10)continue;
      const position=worldTilePosition(x,y);if(!visible(x*MAP_CELL,y*MAP_CELL-20,MAP_CELL,MAP_CELL+20))continue;
      entities.push({y:position.y+36,draw:()=>this.mapObject(c,s,type,x,y)});
    }
    entities.sort((a,b)=>a.y-b.y);for(const e of entities)e.draw();
  }
  mapObject(c,s,type,gx,gy) {
    const x=(gx+.5)*MAP_CELL,y=gy*MAP_CELL,p=this.theme;
    if(type===11){
      c.save();c.filter=`hue-rotate(${(hash(gx,gy)%3+1)*65}deg)`;drawPlayer(c,x,y+38,'down',0);c.restore();
      c.save();c.fillStyle=p.dark;c.beginPath();c.roundRect(x-11,y-3,22,16,5);c.fill();c.fillStyle='#f4e5be';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('···',x,y+7);c.restore();return;
    }
    const cleared=Boolean(s.game.flags?.stageClearedFlags?.[s.stageId]);
    const near=Math.abs(s.player.x-gx)+Math.abs(s.player.y-gy)<=1;
    const name={3:'spring',4:'shrine',5:'tent',6:'trail',7:'trail',8:'shop',12:'inn',13:'village',14:'village'}[type];
    const colors={3:'#8fd8df',4:cleared?'#9dca9a':'#efbd76',6:'#edd397'};
    const color=colors[type]||'#e9d5a0';
    c.save();c.fillStyle=p.dark+'45';c.beginPath();c.ellipse(x,y+57,27,10,0,0,Math.PI*2);c.fill();
    if(!drawMapArt(c,name,x,y+89,type===4||type===13?116:106)){
      if(type===3||type===4)this.shrine.call({marker(){}},themeContext(c,p),x-25,y+7,50,type===3||!cleared);
      else this.camp.call({marker(){}},themeContext(c,p),x-25,y+9,50);
    }
    const labels={3:['泉','Spring'],4:cleared?['踏破','Cleared']:['ぬし','Boss'],5:['牧場','Ranch'],6:['次のエリア','Next area'],7:['戻る','Back'],8:['お店','Shop'],12:['宿屋','Inn'],13:['まち','Town'],14:['外へ','Exit']};
    const text=labels[type]&&tr(s.game,...labels[type]);
    if(text){
      const bob=s.game.reducedMotion?0:Math.sin(s.time*2.5+gx)*1.5;
      const sy=y-8+bob;
      c.font='bold 12px "Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
      const width=Math.max(38,c.measureText(text).width+18);
      c.fillStyle=near?'#f3dfaa':p.dark+'ed';c.beginPath();c.roundRect(x-width/2,sy-17,width,23,4);c.fill();
      c.fillStyle=near?p.dark:color;c.textAlign='center';c.fillText(text,x,sy-1);
      polygon(c,near?'#f3dfaa':p.dark+'ed',[[x-4,sy+5],[x+4,sy+5],[x,sy+10]]);
    }
    if(type===4&&cleared){c.fillStyle='#c8e6ab';c.font='bold 18px sans-serif';c.textAlign='center';c.fillText('✓',x,y+39);}
    if(near){c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(x,y+60,29,10,0,0,Math.PI*2);c.stroke();}
    c.restore();
  }
  atmosphere(c,s) {
    const p=this.theme||mapTheme(s),t=s.game.reducedMotion?0:s.time;
    c.save();c.beginPath();c.rect(0,FIELD_TOP,WIDTH,HEIGHT-FIELD_TOP);c.clip();
    if(!p.cave&&['forest','snow','reverse'].includes(s.world)){
      c.globalAlpha=.045;c.fillStyle=p.light;
      for(let i=0;i<3;i++)polygon(c,p.light,[[50+i*227+Math.sin(t*.15)*8,FIELD_TOP],[105+i*227,FIELD_TOP],[240+i*227,HEIGHT],[163+i*227,HEIGHT]]);
    }
    if(s.world==='sea'&&!p.cave){
      c.globalAlpha=.13;c.strokeStyle='#c9ece5';c.lineWidth=2;
      for(let i=0;i<10;i++){
        const x=(i*91+Math.sin(t*.5+i)*10)%WIDTH,y=FIELD_TOP+48+(i*67)%310;
        c.beginPath();c.ellipse(x,y,19+Math.sin(t+i)*3,5,.3,0,Math.PI*1.5);c.stroke();
      }
    }
    c.globalAlpha=1;
    const entering=Math.max(0,1-(s.time-(s.stageEnteredAt||0))/.4);
    if(!s.game.reducedMotion&&entering>0){c.fillStyle=p.dark;c.globalAlpha=entering*.5;c.fillRect(0,FIELD_TOP,WIDTH,HEIGHT-FIELD_TOP);c.globalAlpha=1;}
    const shade=c.createLinearGradient(0,FIELD_TOP,0,HEIGHT);shade.addColorStop(0,p.dark+'26');shade.addColorStop(.25,p.dark+'00');shade.addColorStop(.82,p.dark+'00');shade.addColorStop(1,p.dark+'40');
    c.fillStyle=shade;c.fillRect(0,FIELD_TOP,WIDTH,HEIGHT-FIELD_TOP);c.restore();
  }
  miniMap(c,s) {
    const p=this.theme,scale=3.5,mw=s.map[0].length*scale,mh=s.map.length*scale,x=WIDTH-mw-16,y=FIELD_TOP+18;
    c.save();rect(c,p.dark+'e8',x-6,y-6,mw+12,mh+12);
    c.strokeStyle=p.fleck+'80';c.lineWidth=1;c.strokeRect(x-6.5,y-6.5,mw+13,mh+13);
    for(let gy=0;gy<s.map.length;gy++)for(let gx=0;gx<s.map[gy].length;gx++){
      const type=s.map[gy][gx];c.fillStyle=type===2||type===10?p.leaves[0]:type===1?p.plant[1]:type===3?'#78adb2':this.paths.has(key(gx,gy))?p.path:p.floor[0];c.fillRect(x+gx*scale,y+gy*scale,scale,scale);
      if(DESTINATIONS.includes(type)){c.fillStyle=type===4?(s.game.flags?.stageClearedFlags?.[s.stageId]?'#add8a2':'#e5ad71'):type===3?'#8fd8df':type===6?'#f4e4b0':'#cfb785';c.fillRect(x+gx*scale,y+gy*scale,3,3);}
    }
    const camera=mapCamera(s);c.strokeStyle='#fff4cd90';c.lineWidth=1;c.strokeRect(x+camera.x/MAP_CELL*scale,y+camera.y/MAP_CELL*scale,camera.width/MAP_CELL*scale,camera.height/MAP_CELL*scale);
    c.fillStyle='#fff8d9';c.fillRect(x+s.player.x*scale-.5,y+s.player.y*scale-.5,4,4);c.restore();
  }
  tree(c,x,y,t,n){
    c.fillStyle='#174d3c55';c.beginPath();c.ellipse(x+t*.52,y+t*.86,t*.67,t*.27,0,0,Math.PI*2);c.fill();rect(c,'#726e4a',x+t*.42,y+t*.38,t*.18,t*.5);rect(c,'#536049',x+t*.53,y+t*.4,t*.07,t*.45);
    const palette=n%2?['#204d3c','#2d6145','#3e7953','#57905e']:['#24543e','#306b4c','#49855a','#69a069'];
    polygon(c,palette[0],[[x-t*.18,y+t*.48],[x-t*.12,y+t*.14],[x+t*.06,y-t*.06],[x+t*.1,y-t*.32],[x+t*.4,y-t*.56],[x+t*.67,y-t*.48],[x+t*.82,y-t*.26],[x+t*1.04,y-t*.04],[x+t*1.18,y+t*.27],[x+t*1.09,y+t*.5],[x+t*.78,y+t*.67],[x+t*.17,y+t*.66]]);
    polygon(c,palette[1],[[x-t*.1,y+t*.3],[x+t*.05,y+t*.05],[x+t*.15,y-t*.32],[x+t*.43,y-t*.49],[x+t*.69,y-t*.35],[x+t*.75,y-t*.14],[x+t*1.06,y+t*.03],[x+t*1.08,y+t*.32],[x+t*.7,y+t*.5],[x+t*.22,y+t*.46]]);
    polygon(c,palette[2],[[x+t*.01,y+t*.1],[x+t*.17,y-t*.12],[x+t*.24,y-t*.31],[x+t*.5,y-t*.43],[x+t*.67,y-t*.22],[x+t*.65,y+t*.07],[x+t*.37,y+t*.22],[x+t*.15,y+t*.2]]);
    rect(c,palette[3],x+t*.27,y-t*.27,t*.19,t*.07);rect(c,palette[3],x+t*.1,y+t*.03,t*.15,t*.07);rect(c,palette[2],x+t*.75,y+t*.17,t*.15,t*.07);
  }
  camp(c,x,y,t){
    polygon(c,'#224d3c',[[x-8,y+t],[x+t+8,y+t],[x+t*.5,y-t*.5]]);polygon(c,'#dfc887',[[x-4,y+t*.9],[x+t*.5,y-t*.35],[x+t*.5,y+t*.9]]);polygon(c,'#aeaa71',[[x+t*.5,y-t*.35],[x+t+4,y+t*.9],[x+t*.5,y+t*.9]]);polygon(c,'#3a5940',[[x+t*.31,y+t*.9],[x+t*.5,y+t*.2],[x+t*.69,y+t*.9]]);rect(c,'#e9d795',x+t*.48,y-t*.38,3,t*.27);this.marker(c,x+t*.5,y-t*.5,'⌂','#f4dfa1');
  }
  shrine(c,x,y,t,lit){
    c.fillStyle='#244d3e50';c.beginPath();c.ellipse(x+t*.5,y+t*.85,t*.42,t*.15,0,0,Math.PI*2);c.fill();rect(c,'#84977a',x+t*.18,y+t*.65,t*.64,t*.22);rect(c,'#adbb95',x+t*.28,y+t*.3,t*.44,t*.42);rect(c,'#5e7966',x+t*.36,y+t*.38,t*.28,t*.26);rect(c,lit?'#f2cf79':'#304e41',x+t*.42,y+t*.38,t*.16,t*.19);polygon(c,'#bfc69c',[[x+t*.18,y+t*.3],[x+t*.5,y-t*.02],[x+t*.82,y+t*.3]]);
    if(lit){c.fillStyle='#f2cf7930';c.beginPath();c.arc(x+t*.5,y+t*.43,t*.52,0,Math.PI*2);c.fill();this.marker(c,x+t*.5,y-t*.22,'✦','#f2cf79');}else this.marker(c,x+t*.5,y-t*.22,'◇','#d4e2b5');
  }
  marker(c,x,y,text,color){c.font='bold 12px sans-serif';c.textAlign='center';c.fillStyle='#173e36cc';c.beginPath();c.roundRect(x-10,y-12,20,20,6);c.fill();c.fillStyle=color;c.fillText(text,x,y+2);}
  cactus(ctx, px, py) {
      ctx.fillStyle = "#3f9c5a"; ctx.strokeStyle = "#286a3d"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(px + 16, py + 6, 8, 30, 4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(px + 6, py + 16, 6, 14, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 12, py + 22); ctx.lineTo(px + 12, py + 16); ctx.lineTo(px + 16, py + 16); ctx.stroke();
      ctx.beginPath(); ctx.roundRect(px + 28, py + 12, 6, 16, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 28, py + 18); ctx.lineTo(px + 28, py + 12); ctx.lineTo(px + 24, py + 12); ctx.stroke();
      ctx.fillStyle = "#f2e6a0";
      ctx.beginPath(); ctx.arc(px + 20, py + 4, 2.5, 0, Math.PI * 2); ctx.fill();

  }
  rock(ctx, px, py) {
      ctx.fillStyle = "#a58860"; ctx.strokeStyle = "#6d5636"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 32); ctx.lineTo(px + 14, py + 12);
      ctx.lineTo(px + 26, py + 12); ctx.lineTo(px + 32, py + 32);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#84683f";
      ctx.beginPath(); ctx.arc(px + 16, py + 20, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 25, py + 24, 2, 0, Math.PI * 2); ctx.fill();

  }
}
