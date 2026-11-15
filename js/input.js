const KEYMAP={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyZ:'ok',Enter:'ok',KeyX:'cancel',Escape:'cancel',KeyS:'save',KeyD:'dex',KeyN:'rename',KeyM:'mute',KeyW:'warp',KeyL:'lang',KeyQ:'quest'};

export class Input{
  constructor(target=window){
    this.held=new Set();this.pressed=new Set();this.sources=new Map();
    target.addEventListener('keydown',e=>{
      const active=globalThis.document?.activeElement;
      if(active&&(['INPUT','TEXTAREA','SELECT'].includes(active.tagName)||active.isContentEditable))return;
      const action=KEYMAP[e.code];if(!action)return;e.preventDefault();this.press(action,'keyboard:'+e.code);
    });
    target.addEventListener('keyup',e=>{const action=KEYMAP[e.code];if(action)this.release(action,'keyboard:'+e.code)});
    target.addEventListener('blur',()=>this.clear());
    globalThis.document?.addEventListener?.('visibilitychange',()=>{if(document.hidden)this.clear()});
  }
  isHeld(action){return this.held.has(action)}
  wasPressed(action){return this.pressed.has(action)}
  endFrame(){this.pressed.clear()}
  press(action,source='virtual:'+action){
    const sources=this.sources.get(action)||new Set();
    if(!sources.size)this.pressed.add(action);
    sources.add(source);this.sources.set(action,sources);this.held.add(action);
  }
  release(action,source='virtual:'+action){
    const sources=this.sources.get(action);if(!sources)return;sources.delete(source);
    if(!sources.size){this.sources.delete(action);this.held.delete(action)}
  }
  clear(){this.sources.clear();this.held.clear();this.pressed.clear()}
}

export function bindTouchControls(root,input){
  root.querySelectorAll('[data-action]').forEach(button=>{
    const action=button.dataset.action;
    button.addEventListener('pointerdown',e=>{e.preventDefault();input.press(action,'pointer:'+e.pointerId);button.setPointerCapture?.(e.pointerId)});
    const release=e=>{input.release(action,'pointer:'+e.pointerId)};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
    button.addEventListener('click',e=>{if(e.detail===0){input.press(action,'assistive:'+action);input.release(action,'assistive:'+action)}});
  });
}
