// Higgsfield adapters are filled from its canonical repository, never historical bests.
export const higgsProfiles={
 'neko-survivor':{boards:[{id:'score',label:'サバイバル得点',order:'desc',unit:'points',scale:1,min:0,max:100000000}],extract(document){const overlay=document.querySelector('#overlay'),stats=document.querySelector('#stats'),value=document.querySelector('#st-score');if(!overlay||!stats||!value||overlay.classList.contains('hidden')||stats.hidden)return null;const n=Number((value.textContent||'').replace(/,/g,''));return Number.isSafeInteger(n)?{board:'score',value:n,display:value.textContent,fingerprint:`score:${n}`}:null;}}
};
