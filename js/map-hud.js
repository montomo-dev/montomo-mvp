import {drawMonster} from './sprites.js';
import {monsterName} from './data/monsters.js';
import {fitText,hpBar} from './ui.js';
import {mapTheme} from './map-themes.js';
import {tr} from './i18n.js';
const FONT='"Hiragino Maru Gothic ProN", "Yu Gothic", sans-serif';
export function drawMapHud(c,s){
  const p=mapTheme(s),g=s.game,leader=g.party[0];
  c.save();c.textAlign='left';c.fillStyle=p.dark;c.fillRect(0,0,640,96);
  c.fillStyle=p.leaves[1];c.fillRect(0,91,640,3);c.fillStyle=p.fleck;c.fillRect(0,94,640,2);
  c.fillStyle='#ffffff0d';c.fillRect(12,12,223,68);
  c.fillStyle='#ffffff16';c.fillRect(247,12,1,67);
  if(leader){
    c.fillStyle='#f4edce';c.beginPath();c.roundRect(21,22,45,45,8);c.fill();
    drawMonster(c,leader.speciesId,43,46,.47,0,leader.shiny?150:(leader.tintHue||0));
    c.fillStyle='#cbd9c3';c.font=`12px ${FONT}`;c.fillText(tr(g,'いっしょに冒険','Adventure companion'),77,29);
    c.fillStyle='#fff7dc';c.font=`bold 18px ${FONT}`;
    fitText(c,`${monsterName(leader,g.lang)}  Lv.${leader.level}`,77,50,147,12);
    hpBar(c,77,61,91,8,leader.hp/leader.maxHp);
    c.fillStyle='#d9e6cc';c.font=`12px ${FONT}`;c.textAlign='right';c.fillText(`${leader.hp}/${leader.maxHp}`,223,69);c.textAlign='left';
  }
  c.fillStyle='#fff2cc';c.font=`bold 21px ${FONT}`;
  fitText(c,tr(g,s.stage.name,s.stage.nameEn),263,31,278,13);
  c.fillStyle='#e3bc73';c.font=`bold 11px ${FONT}`;c.textAlign='right';
  fitText(c,tr(g,`${g.money||0}円`,`${g.money||0}g`),623,31,70,10);c.textAlign='left';
  c.fillStyle='#f6f3dd';c.font=`17px ${FONT}`;fitText(c,s.objectiveMessage(),263,54,360,12);
  c.fillStyle='#b8cbb8';c.font=`12px ${FONT}`;
  fitText(c,tr(g,`発見 ${g.dex.seen.length}　仲間 ${g.dex.caught.length}`,`Seen ${g.dex.seen.length}    Friends ${g.dex.caught.length}`),263,75,250,11);
  c.restore();
}
