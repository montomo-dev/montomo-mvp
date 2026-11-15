const themes = {
  forest: { floor:['#7b965b','#819b60','#758e55'], path:'#c7b583', edge:'#8d9c65', fleck:'#e1d299', dark:'#173e36', light:'#f2e9a0', obstacle:'tree', leaves:['#204d3c','#2d6145','#3e7953','#57905e'], plant:['#355f46','#749756','#dae8b0'], cloth:['#dfc887','#aeaa71'], texture:'grass' },
  reverse: { floor:['#71638d','#786995','#6a5d85'], path:'#aca39b', edge:'#91869c', fleck:'#ccc2b1', dark:'#342d49', light:'#e5cdf5', obstacle:'tree', leaves:['#463455','#62416e','#845797','#ac7bb9'], plant:['#493551','#996bad','#edcbee'], cloth:['#d1b28c','#957b92'], texture:'grass' },
  sea: { floor:['#60969e','#689ea5','#588d98'], path:'#c2cbb0', edge:'#a0bdb8', fleck:'#deead3', dark:'#254752', light:'#d1eef0', obstacle:'tree', leaves:['#854e68','#a96980','#c78994','#eab5ae'], plant:['#426f78','#d28e99','#f6d8b5'], cloth:['#e3ba99','#bd8b91'], texture:'water' },
  snow: { floor:['#c8dada','#d0dfde','#bfd3d7'], path:'#a4b8b7', edge:'#8aabaa', fleck:'#e6ece1', dark:'#304e59', light:'#e7f4ec', obstacle:'tree', leaves:['#345d60','#608784','#bfd2ce','#f0f3e7'], plant:['#759b9c','#a8c5c3','#f4f5e8'], cloth:['#e0d2b1','#9aada9'], texture:'snow' },
  desert: { floor:['#c6a375','#cda97c','#bf996b'], path:'#b3a06f', edge:'#a49264', fleck:'#e6cb95', dark:'#5b4b38', light:'#f8e3af', obstacle:'cactus', leaves:['#325e47','#51795b','#7a9a69','#b4bb82'], plant:['#73674b','#a88d60','#e4c880'], cloth:['#dbbc82','#a39065'], texture:'sand' },
  factory: { floor:['#6d8280','#718783','#687c7b'], path:'#abafa0', edge:'#7f9990', fleck:'#c9c8a8', dark:'#263d40', light:'#ead7ae', obstacle:'column', leaves:['#304949','#4b6662','#718b7c','#a2b099'], plant:['#344e4c','#728d7a','#dcc58a'], cloth:['#99b3a3','#607e75'], texture:'plate' },
  castle: { floor:['#6d667f','#726b85','#665f77'], path:'#a19aaa', edge:'#898095', fleck:'#c4b9c6', dark:'#332e46', light:'#e1cdef', obstacle:'column', leaves:['#38364c','#565168','#827b90','#b5a6bb'], plant:['#474458','#8c7a96','#dec6e1'], cloth:['#ae91b5','#746780'], texture:'stone' },
};

export function mapTheme(scene) {
  const source=themes[scene.world] || themes.forest;
  const cave=scene.stageId==='cave' || scene.stageId.endsWith('_cave');
  const town=Boolean(scene.stage.townExitStage);
  const base={...source,floor:[...source.floor],leaves:[...source.leaves],plant:[...source.plant],cloth:[...source.cloth],cave,town};
  if(cave){base.floor=[source.dark,source.leaves[0],source.dark];base.path=source.leaves[1];base.edge=source.leaves[0];base.fleck=source.leaves[2];base.obstacle='rock';base.texture='stone';}
  if(town){base.floor=[source.path,source.fleck,source.path];base.path=source.edge;base.texture='stone';}
  base.colors={
    '#204d3c':base.leaves[0],'#24543e':base.leaves[0],'#2d6145':base.leaves[1],'#306b4c':base.leaves[1],
    '#3e7953':base.leaves[2],'#49855a':base.leaves[2],'#57905e':base.leaves[3],'#69a069':base.leaves[3],
    '#174d3c':base.dark,'#244d3e':base.dark,'#726e4a':base.edge,'#536049':base.dark,
    '#224d3c':base.dark,'#dfc887':base.cloth[0],'#aeaa71':base.cloth[1],'#3a5940':base.dark,'#e9d795':base.fleck,
    '#84977a':base.leaves[1],'#adbb95':base.leaves[2],'#5e7966':base.leaves[0],'#bfc69c':base.leaves[3],'#304e41':base.dark,
    '#a58860':base.leaves[2],'#6d5636':base.dark,'#84683f':base.leaves[1],
    '#3f9c5a':base.leaves[1],'#286a3d':base.leaves[0],'#f2e6a0':base.leaves[3],
  };
  if(scene.world==='forest'&&!cave)for(const color of ['#204d3c','#24543e','#2d6145','#306b4c','#3e7953','#49855a','#57905e','#69a069','#174d3c','#726e4a','#536049'])delete base.colors[color];
  return base;
}

export function themeContext(context,theme) {
  return new Proxy(context,{
    get(target,key){const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},
    set(target,key,value){
      if((key==='fillStyle'||key==='strokeStyle')&&typeof value==='string'){
        const color=value.slice(0,7),mapped=theme.colors[color];if(mapped)value=mapped+value.slice(7);
      }
      return Reflect.set(target,key,value,target);
    },
  });
}
