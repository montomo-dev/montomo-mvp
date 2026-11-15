import {higgsProfiles} from './adapters-higgs.mjs';
import {eventProfiles} from './adapters-events.mjs';
import {smallProfiles} from './adapters-small.mjs';
import {extraProfiles} from './adapters-more.mjs';
const n=s=>{const m=String(s??'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):NaN};
const out=(board,value,display)=>Number.isSafeInteger(Math.round(value))?{board,value:Math.round(value),display:String(display),fingerprint:`${board}:${Math.round(value)}`}:null;
const t=(d,s)=>d.querySelector(s)?.textContent||'';
const pizzaBoards=Array.from({length:10},(_,i)=>({id:`stage-${i+1}`,label:`ステージ${i+1} クリアタイム`,order:'asc',unit:'ms',scale:1000,min:1,max:86400000}));
const prefectures={'北海道':'01','千葉県':'12','愛知県':'23','大阪府':'27','沖縄県':'47'};
export const gameProfiles={...higgsProfiles,...eventProfiles,...smallProfiles,...extraProfiles,
'cap-baseball':{boards:[{id:'player-score',label:'試合の得点',order:'desc',unit:'runs',scale:1,min:0,max:1000}],extract(d){const e=d.querySelector('#result-screen'),v=t(d,'#final-player');return e&&!e.classList.contains('hidden')&&v?out('player-score',n(v),v+'点'):null}},
'checkin-unseen':{boards:[{id:'time-ms',label:'クリアタイム',order:'asc',unit:'ms',scale:1000,min:1,max:3600000}],extract(d){const e=d.querySelector('.result-panel.success'),v=t(d,'.result-panel.success .result-time');return e&&v?out('time-ms',n(v)*1000,v):null}},
'pizza-balance':{boards:pizzaBoards,extract(d){const time=t(d,'.result-time'),stage=t(d,'.stage-kicker').match(/STAGE\s+(\d+)/i)?.[1];return time&&stage?out(`stage-${stage}`,n(time)*1000,time):null}},
'bousou-sushi':{boards:[{id:'score',label:'最終スコア',order:'desc',unit:'points',scale:1,min:0,max:100000000}],extract(d){const label=t(d,'.result-score span'),v=t(d,'.result-score strong');return label==='最終スコア'&&v?out('score',n(v),v+'点'):null}},
'habit-stack':{boards:[{id:'days',label:'積み上げた日数',order:'desc',unit:'days',scale:1,min:0,max:100000}],extract(d){const s=d.querySelector('#game-shell'),v=t(d,'.result-number');return s?.dataset.state==='GAME_OVER'&&v?out('days',n(v),v):null}},
'prefecture-frisbee':{boards:Object.entries(prefectures).map(([name,id])=>({id:'pref-'+id,label:name+'・1投の飛距離',order:'desc',unit:'cm',scale:100,min:0,max:10000000})),extract(d){const k=t(d,'.result-kicker');if(!k||k.includes('再現'))return null;const pref=prefectures[t(d,'.result-stats strong')],v=k.includes('3投完了')?t(d,'.current-throw'):t(d,'.result-distance');return pref&&v?out('pref-'+pref,n(v)*100,v):null}},
};
export default gameProfiles;
