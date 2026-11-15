// 2026-10-02 gpt-6.1-sol再制作: 外部音源を使わない短い合成効果音。
const MUTE_KEY='montomo-audio-muted';let muted=false,context=null,unlocked=false;
try{muted=typeof localStorage!=='undefined'&&localStorage.getItem(MUTE_KEY)==='1'}catch{}
function audio(){
  if(muted||!unlocked||typeof window==='undefined')return null;
  try{context??=new(window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume().catch(()=>{});return context}catch{return null}
}
if(typeof window!=='undefined'){const unlock=()=>{unlocked=true;audio()};window.addEventListener('pointerdown',unlock,{once:true,capture:true,passive:true});window.addEventListener('keydown',unlock,{once:true,capture:true})}
export function isMuted(){return muted}
export function toggleMute(){muted=!muted;try{if(typeof localStorage!=='undefined')localStorage.setItem(MUTE_KEY,muted?'1':'0')}catch{}return muted}
function tone(note,duration=.1,delay=0,type='triangle',end=null,gain=.07){
  const a=audio();if(!a)return;try{const o=a.createOscillator(),g=a.createGain(),start=a.currentTime+delay,f=440*2**((note-69)/12);o.type=type;o.frequency.setValueAtTime(f,start);if(end!==null)o.frequency.exponentialRampToValueAtTime(440*2**((end-69)/12),start+duration);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(gain,start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(a.destination);o.onended=()=>{o.disconnect();g.disconnect()};o.start(start);o.stop(start+duration+.01)}catch{}
}
function phrase(notes,gap=.075,type='triangle'){notes.forEach((n,i)=>tone(n,i===notes.length-1 ? .19 : .095,i*gap,type))}
export function sfxSelect(){tone(76,.045,0,'sine')}
export function sfxConfirm(){phrase([72,79],.06)}
export function sfxCancel(){tone(65,.12,0,'triangle',58)}
export function sfxHit(){tone(48,.07,0,'sawtooth',34,.055);tone(38,.11,.015,'triangle',29,.055)}
export function sfxFaint(){phrase([60,55,48],.1,'sine')}
export function sfxLevelUp(){phrase([67,72,76,79],.08)}
export function sfxEvolve(){phrase([60,64,67,74,79,84],.09,'sine')}
export function sfxCatchSuccess(){phrase([74,77,81,86],.07)}
export function sfxCatchFail(){tone(59,.18,0,'sine',52)}
export function sfxItemGet(){phrase([76,83,88],.06,'sine')}
export function sfxSave(){phrase([62,69,74],.06,'sine')}
export function sfxBreed(){phrase([64,67,72,76,79],.09)}
export function sfxCry(id){let h=2166136261;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;const n=48+h%29,type=['sine','triangle','square'][h%3];tone(n,.105,0,type,n+3,.045);tone(n-2,.15,.08,type,n+(h%2?5:-7),.04)}
