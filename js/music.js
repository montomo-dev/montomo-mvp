import{isMuted}from'./audio.js';

// GPT-6.1-solでこの作品のために構成した旋律。外部音源は読まない。
// 数値は半音単位のMIDI音高。休符はnull。
export const THEMES={
  title:{tempo:96,notes:[72,76,79,null,76,74,72,67,69,72,76,null,74,72,69,67],bass:[48,48,53,55]},
  field:{tempo:104,notes:[72,null,74,76,79,76,74,null,69,null,72,74,76,74,72,null],bass:[48,53,57,55]},
  battle:{tempo:132,notes:[64,67,71,76,71,67,66,69,72,76,72,69,67,71,74,79],bass:[40,40,45,47]},
  boss:{tempo:140,notes:[64,71,76,79,78,76,71,67,66,69,72,78,76,72,69,66],bass:[40,43,45,47]},
  ending:{tempo:84,notes:[72,76,79,84,null,79,76,74,72,null,69,72,76,74,72,null],bass:[48,53,57,48]},
  victory:{tempo:136,notes:[72,76,79,84,null,79,84,null],bass:[48,55]}
};
let audio=null,master=null,current=null,timer=null,nextAt=0,beat=0,muted=isMuted(),suspended=false;
const voices=new Set();
const keyFor=key=>key==='boss'?'boss':key==='battle'?'battle':key==='ending'?'ending':key==='victory'?'victory':key.startsWith('field_')?'field':'title';
function ensureAudio(){
  if(audio)return audio;
  const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return null;
  audio=new Audio();master=audio.createGain();master.gain.value=muted?0:.18;master.connect(audio.destination);return audio;
}
function note(pitch,at,duration,bass=false){
  if(pitch===null)return;
  const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type=bass?'sine':'triangle';oscillator.frequency.value=440*2**((pitch-69)/12);
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(bass ? .22 : .14,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
  oscillator.connect(gain);gain.connect(master);voices.add(oscillator);oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect()};oscillator.start(at);oscillator.stop(at+duration+.015);
}
function schedule(){
  if(!audio||audio.state!=='running'||!current||suspended)return;
  const theme=THEMES[keyFor(current.key)],length=60/theme.tempo/2;
  if(nextAt<audio.currentTime-.1)nextAt=audio.currentTime+.02;
  while(nextAt<audio.currentTime+.16){
    const n=beat%theme.notes.length;note(theme.notes[n],nextAt,length*.85);
    if(beat%4===0)note(theme.bass[Math.floor(beat/4)%theme.bass.length],nextAt,length*3.5,true);
    beat++;nextAt+=length;
    if(!current.loop&&beat>=theme.notes.length){clearInterval(timer);timer=null;current=null;break}
  }
}
function start(){if(!current||suspended||!audio||audio.state!=='running'||timer!==null)return;nextAt=audio.currentTime+.02;timer=setInterval(schedule,80);schedule()}
function clearVoices(){for(const voice of voices){try{voice.stop()}catch{}}voices.clear()}
export function playBgm(key,{loop=true}={}){if(current?.key===key)return;stopBgm();current={key,loop};beat=0;start()}
export function stopBgm(){if(timer!==null)clearInterval(timer);timer=null;clearVoices();current=null}
export function setBgmMuted(value){muted=Boolean(value);if(master&&audio)master.gain.setTargetAtTime(muted?0:.18,audio.currentTime,.03)}
export function setBgmSuspended(value){suspended=Boolean(value);if(suspended){if(timer!==null)clearInterval(timer);timer=null;clearVoices()}else start()}
async function unlock(){try{if(!ensureAudio())return;await audio.resume();start()}catch{}}
globalThis.window?.addEventListener?.('pointerdown',unlock);
globalThis.window?.addEventListener?.('keydown',unlock);
