// These games draw results on canvas or hide precise run state in closures.
// Their canonical finish functions emit game-social:result; no historic best scraping.
const score=(id,label,max=100000000)=>({id,label,order:'desc',unit:'points',scale:1,min:0,max});
const time=(id,label,max=3600000)=>({id,label,order:'asc',unit:'ms',scale:1,min:0,max});
export const eventProfiles={
 'gogh-run':{boards:[score('score','星月夜のラン得点')]},
 'skybreak-arena':{boards:[score('score','アリーナ得点')]},
 'hitofudegaki':{boards:['easy','normal','hard'].map((id,i)=>time(id,['かんたん','ふつう','むずかしい'][i]+'（ヒントなし）'))},
 'reflex-party':{boards:[time('quickdraw','1P・早撃ち',10000),time('clock-error','1P・体内時計の誤差',10000),score('masher','1P・5秒連打',1000)]},
};
