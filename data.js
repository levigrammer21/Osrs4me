export const VERSION=1, W=80,H=60,TICK=600,CAP=28;
export const SKILLS=['Fishing','Mining','Woodcutting','Cooking','Smithing','Crafting','Herblore','Melee','Magic','Ranged','HP','Slayer','Prayer'];
export const ICON={Fishing:'♓',Mining:'⛏',Woodcutting:'♠',Cooking:'♨',Smithing:'⚒',Crafting:'✂',Herblore:'⚗',Melee:'⚔',Magic:'✦',Ranged:'➶',HP:'♥',Slayer:'☠',Prayer:'✧'};
export const TIERS=['Bronze','Iron','Steel','Mithril','Adamant','Runic'];
export const REQS=[1,10,25,40,60,80];
export const ITEMS={};
function item(id,name,value,extra={}){ITEMS[id]={id,name,value,...extra};}
for(let t=0;t<6;t++){
 const fish=['Shrimp','Trout','Salmon','Lobster','Swordfish','Shark'][t],wood=['Logs','Oak logs','Willow logs','Maple logs','Yew logs','Elder logs'][t],ore=['Copper ore','Iron ore','Coal ore','Mithril ore','Adamant ore','Runic ore'][t];
 item('fish'+t,'Raw '+fish.toLowerCase(),3+t*5,{icon:'♓',tier:t});item('food'+t,fish,7+t*10,{icon:'♨',heal:8+t*7,tier:t});
 item('ore'+t,ore,5+t*7,{icon:'◆',tier:t});item('wood'+t,wood,4+t*6,{icon:'♠',tier:t});item('bar'+t,TIERS[t]+' bar',15+t*20,{icon:'▬',tier:t});
 item('herb'+t,['Guam','Marrentill','Tarromin','Harralander','Ranarr','Torstol'][t],7+t*8,{icon:'❧',tier:t});
 for(const [kind,style,skill,icon] of [['sword','Melee','Melee','⚔'],['bow','Ranged','Ranged','➶'],['staff','Magic','Magic','✦']])item(kind+t,TIERS[t]+' '+kind,45+Math.round(85*Math.pow(2.2,t)),{icon,slot:'weapon',style,skill,req:REQS[t],power:2+t*4,tier:t});
 item('armor'+t,TIERS[t]+' armour',65+Math.round(100*Math.pow(2.2,t)),{icon:'♜',slot:'armor',skill:'HP',req:Math.max(1,REQS[t]-5),def:2+t*3,tier:t});
 item('amulet'+t,['Copper','Silver','Sapphire','Emerald','Ruby','Dragonstone'][t]+' amulet',40+t*100,{icon:'◇',slot:'amulet',skill:'Crafting',req:REQS[t],power:1+t,def:t,tier:t});
}
item('arrow','Arrows',2,{icon:'➶',stack:true});item('bone','Bones',5,{icon:'♧',stack:true});item('hide','Hide',9,{icon:'▱'});item('gem','Uncut gem',28,{icon:'◆',stack:true});
item('health','Health potion',38,{icon:'⚗',heal:30});item('mana','Mana potion',32,{icon:'⚗',mana:30});item('power','Battle potion',60,{icon:'⚗',buff:true});item('restore','Prayer potion',65,{icon:'⚗',prayer:25});
item('leather','Leather armour',30,{icon:'♜',slot:'armor',skill:'Crafting',req:1,def:2,tier:0});
export const RECIPES=[];
function recipe(id,skill,req,station,input,out,xp,count=1){RECIPES.push({id,skill,req,station,input,out,xp,count});}
for(let t=0;t<6;t++){
 recipe('cook'+t,'Cooking',REQS[t],'range',{['fish'+t]:1},'food'+t,20+t*20);
 recipe('smelt'+t,'Smithing',REQS[t],'forge',{['ore'+t]:2},'bar'+t,25+t*20);
 recipe('sword'+t,'Smithing',REQS[t],'forge',{['bar'+t]:2},'sword'+t,40+t*30);
 recipe('armor'+t,'Smithing',REQS[t],'forge',{['bar'+t]:3},'armor'+t,55+t*35);
 recipe('bow'+t,'Crafting',REQS[t],'workshop',{['wood'+t]:2},'bow'+t,35+t*25);
 recipe('staff'+t,'Crafting',REQS[t],'workshop',{['wood'+t]:2,gem:1},'staff'+t,40+t*25);
 recipe('amulet'+t,'Crafting',REQS[t],'workshop',{['bar'+t]:1,gem:1},'amulet'+t,45+t*30);
}
recipe('arrows','Crafting',1,'workshop',{wood0:1,ore0:1},'arrow',15,20);
recipe('leather','Crafting',1,'workshop',{hide:2},'leather',25);
recipe('health','Herblore',1,'apothecary',{herb0:2},'health',30);
recipe('mana','Herblore',10,'apothecary',{herb1:2},'mana',45);
recipe('power','Herblore',25,'apothecary',{herb2:2,herb0:1},'power',70);
recipe('restore','Herblore',40,'apothecary',{herb3:2},'restore',90);
export const BUILDINGS={
 bank:{name:'Bank',cost:100,icon:'▣',color:'#b4a385',desc:'Private storage for every adventurer. Deposits, supplies and gravestone recovery.'},
 market:{name:'Trading post',cost:140,icon:'⚖',color:'#bf8264',desc:'Buy and sell equipment and supplies. Real stock, a realm trade levy.'},
 forge:{name:'Forge',cost:110,icon:'⚒',color:'#969bb0',desc:'Smelt ore into bars and smith weapons and armour.'},
 range:{name:'Cookhouse',cost:70,icon:'♨',color:'#c48d67',desc:'Turn fresh fish into food for adventurers.'},
 workshop:{name:'Workshop',cost:100,icon:'✂',color:'#b9a76d',desc:'Craft bows, arrows, staves, leather and jewellery.'},
 apothecary:{name:'Apothecary',cost:120,icon:'⚗',color:'#9aa77f',desc:'Brew health, mana, battle and prayer potions.'},
 altar:{name:'Prayer shrine',cost:90,icon:'✧',color:'#b7b0cd',desc:'Offer bones for Prayer XP. Restore prayer points.'},
 slayer:{name:'Slayer lodge',cost:160,icon:'☠',color:'#ab867c',desc:'Monster assignments, Slayer XP, points and bounty rewards.'},
 tavern:{name:'Tavern',cost:90,icon:'♜',color:'#b39573',desc:'Adventurers rest here to heal and replenish mana.'},
 fountain:{name:'Fountain',cost:40,icon:'⛲',color:'#80aeb6',desc:'A gathering place. Beauty contributes to realm appeal.'},
 lamp:{name:'Lantern',cost:8,icon:'✦',color:'#dac17d',desc:'Warm light along your roads.'},
 banner:{name:'Realm banner',cost:15,icon:'⚑',color:'#618f9c',desc:'Mark your settlement with a fluttering standard.'},
 wall:{name:'Stone wall',cost:8,icon:'▥',color:'#969b92',desc:'Blocks movement. Leave gateways to keep routes open.'},
 bridge:{name:'Bridge',cost:20,icon:'═',color:'#b49a6d',desc:'A crossing over water. Paint a continuous crossing.'}
};
export const RESOURCES={};
for(let t=0;t<6;t++)for(const [kind,skill,prefix,col] of [['tree','Woodcutting','wood','#477947'],['rock','Mining','ore','#999c9f'],['fish','Fishing','fish','#6fb9c5'],['herb','Herblore','herb','#95b75d']])RESOURCES[kind+t]={name:ITEMS[prefix+t].name.replace('Raw ','')+(kind==='tree'?' grove':kind==='rock'?' vein':kind==='fish'?' shoal':' patch'),kind,skill,tier:t,req:REQS[t],out:prefix+t,xp:15+t*18,cost:12+t*22,color:col,icon:ICON[skill],capacity:5+t*2,respawn:25+t*8};
export const MONSTERS={
 rat:{name:'Giant rat',level:1,hp:12,max:2,def:0,xp:8,gold:[2,6],color:'#9a8a78',cost:15,drops:[['hide',.35],['herb0',.25]],shape:'rat'},
 goblin:{name:'Goblin',level:5,hp:25,max:4,def:1,xp:12,gold:[5,12],color:'#80a35e',cost:25,drops:[['ore0',.4],['sword0',.03],['herb0',.35]],shape:'goblin'},
 wolf:{name:'Grey wolf',level:12,hp:45,max:6,def:2,xp:20,gold:[8,18],color:'#a1aab6',cost:45,drops:[['hide',.8],['herb1',.3]],shape:'wolf',aggro:true},
 skeleton:{name:'Skeleton',level:22,hp:65,max:8,def:4,xp:28,gold:[15,30],color:'#d5d0b8',cost:70,drops:[['sword1',.04],['gem',.2],['herb2',.3]],shape:'skeleton',aggro:true},
 ogre:{name:'Hill ogre',level:35,hp:110,max:11,def:6,xp:45,gold:[25,50],color:'#8d9863',cost:110,drops:[['armor2',.035],['herb3',.4],['gem',.25]],shape:'ogre',aggro:true},
 wraith:{name:'Ash wraith',level:50,hp:150,max:15,def:8,xp:65,gold:[40,80],color:'#9d91c2',cost:165,drops:[['staff3',.025],['herb4',.4],['gem',.4]],shape:'wraith',slayer:20,aggro:true},
 demon:{name:'Greater demon',level:68,hp:230,max:20,def:12,xp:100,gold:[70,130],color:'#b85d58',cost:240,drops:[['sword4',.02],['herb5',.4],['gem',.6]],shape:'demon',slayer:40,aggro:true},
 dragon:{name:'Elder dragon',level:85,hp:500,max:26,def:16,xp:220,gold:[180,350],color:'#64998c',cost:450,drops:[['armor5',.035],['sword5',.025],['gem',1]],shape:'dragon',boss:true,aggro:true},
 titan:{name:'The Hollow King',level:99,hp:900,max:32,def:20,xp:400,gold:[350,650],color:'#b1a2ce',cost:700,drops:[['amulet5',.1],['staff5',.06],['gem',1]],shape:'titan',boss:true,slayer:65,aggro:true}
};
export const PERSONALITIES=['Warrior','Angler','Miner','Lumberjack','Artisan','Mage','Ranger','Alchemist','Hunter','PKer','Explorer'];
export const NAMES=['Levi','Rowan','Briar','Flint','Mira','Ash','Wren','Orin','Sable','Finch','Aldric','Ember','Thorne','Ivy','Kestrel','Dax','Juniper','Rook','Sylva','Garrick','Opal','Cinder','Vale','Tansy','Holt','Nyx','Fenn','Lark','Bram','Elara','Pike','Aster','Ronan','Willow','Knox','Lyra','Basil','Vex','Fern','Corin','Jade','Moss','Talon','Hazel','Drake','Luna','Reed','Petra','Onyx','Skye'];
export function threshold(l){let n=0;for(let i=1;i<l;i++)n+=Math.floor(55*Math.pow(1.085,i-1));return n;}
export function level(xp){let l=1;while(l<99&&xp>=threshold(l+1))l++;return l;}
export const MILESTONES=[{name:'A place to gather',desc:'Place 10 resource nodes',test:s=>s.nodes.length>=10},{name:'Working village',desc:'Build 5 different services',test:s=>new Set(s.buildings.filter(b=>!['lamp','wall','banner','bridge','fountain'].includes(b.type)).map(b=>b.type)).size>=5},{name:'First blood',desc:'Adventurers defeat 60 monsters',test:s=>s.stats.kills>=60},{name:'Trade routes',desc:'Complete 100 market transactions',test:s=>s.stats.trades>=100},{name:'A richer realm',desc:'Place resources from 4 tiers',test:s=>new Set(s.nodes.map(n=>RESOURCES[n.type].tier)).size>=4},{name:'The dangerous frontier',desc:'Paint 80 Wilderness tiles and place 5 enemy camps',test:s=>s.wild.filter(Boolean).length>=80&&s.spawns.length>=5},{name:'Skilled community',desc:'Reach 900 total skill levels across the realm',test:s=>s.actors.reduce((n,a)=>n+SKILLS.reduce((v,k)=>v+level(a.xp[k]),0),0)>=900},{name:'A legend begins',desc:'Defeat a boss, or reach 1,500 total skill levels',test:s=>s.stats.bosses>0||s.actors.reduce((n,a)=>n+SKILLS.reduce((v,k)=>v+level(a.xp[k]),0),0)>=1500}];
