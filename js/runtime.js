// 入力の取りこぼしとタブ復帰時の長い移動を避ける固定更新ループ。
export class FixedStepClock{
  constructor(step=1/60,maxSteps=5){this.step=step;this.maxSteps=maxSteps;this.accumulator=0;this.last=null}
  reset(){this.accumulator=0;this.last=null}
  tick(now,update){
    if(this.last===null){this.last=now;return 0}
    const elapsed=Math.max(0,Math.min((now-this.last)/1000,.1));this.last=now;this.accumulator+=elapsed;
    let count=0;while(this.accumulator+1e-10>=this.step&&count<this.maxSteps){update(this.step);this.accumulator-=this.step;count++}
    if(count===this.maxSteps)this.accumulator=Math.min(this.accumulator,this.step);
    return count;
  }
}

export function createRuntime({update,draw,onPause=()=>{},target=window,doc=document}){
  const clock=new FixedStepClock();let paused=false,focused=true,frameId=null;
  function suspended(){return paused||!focused||doc.hidden}
  function sync(){clock.reset();onPause(suspended());if(!doc.hidden&&frameId===null)frameId=target.requestAnimationFrame(frame)}
  function frame(now){frameId=null;if(doc.hidden){clock.reset();return}if(suspended())clock.reset();else clock.tick(now,dt=>update(dt,now));draw(now,suspended());frameId=target.requestAnimationFrame(frame)}
  target.addEventListener('blur',()=>{focused=false;sync()});target.addEventListener('focus',()=>{focused=true;sync()});doc.addEventListener('visibilitychange',sync);
  frameId=target.requestAnimationFrame(frame);
  return{setPaused(value){paused=Boolean(value);sync();return paused},isPaused:()=>suspended(),reset:()=>clock.reset()};
}
