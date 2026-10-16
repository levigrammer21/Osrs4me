import {VERSION,W,H,CAP,SKILLS,ITEMS,TIERS,REQS,RECIPES,BUILDINGS,RESOURCES,MONSTERS,PERSONALITIES,NAMES,MILESTONES,level,threshold} from './data.js';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const idx=(x,y)=>Math.floor(y)*W+Math.floor(x);
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function rng(s){let t=s.seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
const choose=(s,a)=>a[Math.floor(rng(s)*a.length)];
export function log(s,text,kind='world'){s.log.unshift({tick:s.tick,text,kind});s.log=s.log.slice(0,100);}
export function fx(s,x,y,text,color='#f3d58a',kind='text',to=null){s.effects.push({x,y,text,color,kind,to,tick:s.tick});}
export function count(a,id,bank=false){return (bank?a.bank:a.inv)[id]||0;}
export function slots(a){return Object.entries(a.inv).reduce((n,[id,q])=>n+(ITEMS[id]?.stack?1:q),0);}
export function add(a,id,n=1,bank=false){if(!ITEMS[id]||n<=0)return 0;const bag=bank?a.bank:a.inv;let q=bank?n:ITEMS[id].stack?(bag[id]?n:slots(a)<CAP?n:0):Math.min(n,CAP-slots(a));if(q>0)bag[id]=(bag[id]||0)+q;return q;}
export function take(a,id,n=1,bank=false){const bag=bank?a.bank:a.inv;if((bag[id]||0)<n)return false;bag[id]-=n;if(!bag[id])delete bag[id];return true;}
export const maxhp=a=>18+level(a.xp.HP)*2;
export const maxmana=a=>20+level(a.xp.Magic)*2;
export const maxprayer=a=>15+level(a.xp.Prayer);
export const combatLevel=a=>Math.floor((level(a.xp.Melee)+level(a.xp.Magic)+level(a.xp.Ranged)+level(a.xp.HP))/4);
export function gain(s,a,k,n){const before=level(a.xp[k]);a.xp[k]+=n;s.stats.xp+=n;const after=level(a.xp[k]);if(after>before){fx(s,a.x,a.y,`${k} ${after}!`,'#edd388');if(a.id===0||after%10===0)log(s,`${a.name} reached ${k} ${after}.`,'level');if(k==='HP')a.hp=Math.min(maxhp(a),a.hp+4);}}
export function actor(s,id,l=1){const trait=id===0?'Explorer':PERSONALITIES[(id-1)%PERSONALITIES.length],style=trait==='Mage'?'Magic':trait==='Ranger'?'Ranged':'Melee';let xp=Object.fromEntries(SKILLS.map(k=>[k,threshold(l)]));xp.HP=threshold(Math.max(5,l));const a={id,name:NAMES[id],trait,style,x:37+id%4,y:33+Math.floor(id/4)%3,px:37,py:33,xp,hp:40,mana:30,prayer:20,gold:100+l*8,inv:{food0:5,arrow:60},bank:{},equipment:{weapon:style==='Magic'?'staff0':style==='Ranged'?'bow0':'sword0',armor:'leather',amulet:null},task:null,order:null,reason:'Finding a place in the realm',cooldown:0,busy:0,target:null,path:[],kills:0,deaths:0,pk:0,slayer:null,slayerPoints:0,retreat:0,skull:0,prayerOn:false,joined:s.tick,decide:0,lastMarket:-200,project:null,history:[],color:['#7faec0','#bc8364','#a19abf','#b5b276','#84a281','#c28f9f'][id%6]};a.hp=maxhp(a);a.mana=maxmana(a);a.prayer=maxprayer(a);return a;}
export function fresh(empty=false){const s={version:VERSION,seed:728193,tick:0,nextId:1,treasury:empty?2300:1650,earned:0,terrain:Array(W*H).fill('grass'),wild:Array(W*H).fill(false),buildings:[],nodes:[],spawns:[],monsters:[],actors:[],graves:[],loot:[],stock:{},log:[],effects:[],milestones:[],arrival:0,stats:{kills:0,bosses:0,trades:0,gathered:0,crafted:0,xp:0,built:0,pk:0},settings:{speed:1,labels:true,sound:false},name:'Realmstead',lastSaved:null};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let k=idx(x,y);if(y<12)s.terrain[k]='ash';if((x-14)**2/75+(y-31)**2/135<1||x>56&&x<61&&y>15&&y<49)s.terrain[k]='water';if((x-65)**2+(y-12)**2<75)s.terrain[k]='stone';}
 for(let i=0;i<10;i++)s.actors.push(actor(s,i));
 for(const id of Object.keys(ITEMS)){s.stock[id]=ITEMS[id].slot?2:ITEMS[id].heal||ITEMS[id].mana?12:0;}s.stock.arrow=1000;
 if(!empty){for(let y=28;y<=40;y++)for(let x=29;x<=49;x++)s.terrain[idx(x,y)]=y===34||x===39?'path':'grass';for(const [type,x,y]of[['bank',36,31],['market',42,31],['range',33,36],['tavern',44,36]])s.buildings.push({id:s.nextId++,type,x,y});
 for(const [type,x,y]of[['tree0',27,28],['tree0',28,31],['tree0',26,34],['tree1',25,27],['rock0',49,28],['rock0',51,30],['rock1',51,26],['fish0',23,31],['fish0',23,35],['herb0',32,24],['herb1',35,24]])place(s,'resource',type,x,y,true);
 for(const [type,x,y]of[['rat',31,43],['rat',35,44],['goblin',46,43]])place(s,'monster',type,x,y,true);}
 log(s,'Welcome, worldbuilder. Shape a realm worth living in.','world');return s;}
export function occupied(s,x,y){return s.buildings.some(b=>b.x===x&&b.y===y)||s.nodes.some(n=>n.x===x&&n.y===y)||s.spawns.some(n=>n.x===x&&n.y===y);}
export function walkable(s,x,y){if(x<0||y<0||x>=W||y>=H)return false;let b=s.buildings.find(b=>b.x===x&&b.y===y);return s.terrain[idx(x,y)]!=='water'&&b?.type!=='wall'||b?.type==='bridge';}
export function wild(s,a){return !!s.wild[idx(a.x,a.y)];}
function canRisk(s,a){return a.order?.risk||a.trait==='PKer'||(!a.order&&a.riskUntil>s.tick);}
export function unlockedTier(s){return Math.min(5,1+Math.floor(s.milestones.length/2));}
export function buildCost(s,category,type){return category==='building'?BUILDINGS[type]?.cost:category==='resource'?RESOURCES[type]?.cost:category==='monster'?MONSTERS[type]?.cost:category==='terrain'?(type==='path'?1:0):0;}
export function place(s,category,type,x,y,free=false){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=W||y>=H)return {ok:false,reason:'Outside the realm'};
 let cost=buildCost(s,category,type)||0;if(!free&&cost>s.treasury)return {ok:false,reason:'Not enough realm gold'};
 if(category==='terrain'){
 if(!['grass','path','water','stone','sand','ash','wild','safe'].includes(type))return {ok:false,reason:'Unknown terrain'};
 if(type==='wild'||type==='safe'){const v=type==='wild';if(s.wild[idx(x,y)]===v)return {ok:false};s.wild[idx(x,y)]=v;}
 else {if(s.terrain[idx(x,y)]===type)return {ok:false};if(type==='water'&&(occupied(s,x,y)||s.actors.some(a=>Math.floor(a.x)===x&&Math.floor(a.y)===y)))return {ok:false,reason:'Clear this tile first'};s.terrain[idx(x,y)]=type;}
 }else{
 let def=category==='building'?BUILDINGS[type]:category==='resource'?RESOURCES[type]:MONSTERS[type];if(!def)return {ok:false,reason:'Unknown object'};if(occupied(s,x,y))return {ok:false,reason:'Tile is occupied'};
 if(category==='building'&&s.terrain[idx(x,y)]==='water'&&type!=='bridge')return {ok:false,reason:'Build on dry land'};
 if(category==='resource'&&s.terrain[idx(x,y)]==='water')return {ok:false,reason:'Place shoals on the shore; other resources on land'};
 if(category==='resource'&&def.kind==='fish'&&!free&&![[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]].some(([dx,dy])=>s.terrain[idx(x+dx,y+dy)]==='water'))return {ok:false,reason:'Fishing spots need a shore. Paint nearby water first'};
 if(category==='monster'&&!walkable(s,x,y))return {ok:false,reason:'Camp needs dry land'};
 if(!free&&category==='resource'&&def.tier>unlockedTier(s))return {ok:false,reason:'Complete more milestones to unlock this tier'};
 if(!free&&category==='monster'&&def.level>25+s.milestones.length*12)return {ok:false,reason:'Complete more milestones to unlock this enemy'};
 const o={id:s.nextId++,type,x,y};if(category==='building')s.buildings.push(o);else if(category==='resource')s.nodes.push({...o,charges:def.capacity,ready:0});else {s.spawns.push({...o,ready:s.tick});spawn(s,o);}s.stats.built++;
 }
 s.treasury-=free?0:cost;for(const a of s.actors)a.path=[];return {ok:true,cost};}
export function erase(s,x,y){x=Math.floor(x);y=Math.floor(y);for(const [key,cat]of[['buildings','building'],['nodes','resource'],['spawns','monster']]){let at=s[key].findIndex(o=>o.x===x&&o.y===y);if(at>=0){let o=s[key].splice(at,1)[0];s.monsters=s.monsters.filter(m=>m.spawn!==o.id);s.treasury+=Math.floor(buildCost(s,cat,o.type)*.6);for(let a of s.actors){a.task=null;a.path=[];}return {ok:true};}}return {ok:false};}
export function relocate(s,kind,id,x,y){x=Math.floor(x);y=Math.floor(y);const list=kind==='building'?s.buildings:kind==='node'?s.nodes:s.spawns,o=list.find(o=>o.id===id);if(!o||x<0||y<0||x>=W||y>=H)return {ok:false,reason:'Invalid location'};if(o.x===x&&o.y===y)return {ok:false};if(occupied(s,x,y))return {ok:false,reason:'Tile is occupied'};if(s.terrain[idx(x,y)]==='water'&&o.type!=='bridge')return {ok:false,reason:'Choose dry land'};o.x=x;o.y=y;if(kind==='camp')for(let m of s.monsters.filter(m=>m.spawn===id)){m.x=x;m.y=y;m.px=x;m.py=y;m.path=[];}for(let a of s.actors){a.path=[];a.task=null;}return {ok:true};}
function spawn(s,p){const d=MONSTERS[p.type];s.monsters.push({id:'m'+s.nextId++,spawn:p.id,type:p.type,x:p.x,y:p.y,px:p.x,py:p.y,hp:d.hp,target:null,cooldown:0,lastHit:null});}
export function pathfind(s,from,to){let sx=clamp(Math.floor(from.x),0,W-1),sy=clamp(Math.floor(from.y),0,H-1),tx=clamp(Math.floor(to.x),0,W-1),ty=clamp(Math.floor(to.y),0,H-1);if(sx===tx&&sy===ty)return [];let start=idx(sx,sy),goal=idx(tx,ty),queue=[start],prev=new Int32Array(W*H).fill(-2);prev[start]=-1;for(let i=0;i<queue.length;i++){let n=queue[i],x=n%W,y=Math.floor(n/W);for(let [dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]]){let nx=x+dx,ny=y+dy;if(!walkable(s,nx,ny))continue;if(typeof from.id==='number'&&!canRisk(s,from)&&!wild(s,from)&&s.wild[idx(nx,ny)])continue;let ni=idx(nx,ny);if(prev[ni]!==-2)continue;prev[ni]=n;if(ni===goal){let out=[];for(let k=ni;k!==start;k=prev[k])out.push({x:k%W,y:Math.floor(k/W)});return out.reverse();}queue.push(ni);}}return null;}
function nearest(s,a,list){return [...list].sort((b,c)=>distance(a,b)-distance(a,c)).find(o=>pathfind(s,a,o)!==null)||null;}
function move(s,a,to,range=0){if(distance(a,to)<=range)return true;const dest=idx(to.x,to.y);if(!a.path?.length||a.destination!==dest){a.path=pathfind(s,a,to)||[];a.destination=dest;}if(a.path.length){let p=a.path.shift();if(walkable(s,p.x,p.y)){a.x=p.x;a.y=p.y;}else a.path=[];}return distance(a,to)<=range;}
function facility(s,a,type){return nearest(s,a,s.buildings.filter(b=>b.type===type));}
function task(s,a,kind,target,reason,extra={}){a.task={kind,target:target?.id??target,started:s.tick,...extra};a.reason=reason;a.path=[];return a.task;}
function tax(s,value){const v=Math.max(1,Math.floor(value*.08));s.treasury+=v;s.earned+=v;s.stats.trades++;}
export function equip(a,id){const d=ITEMS[id];if(!d?.slot||!count(a,id)||level(a.xp[d.skill])<d.req)return false;if(a.equipment[d.slot]){let old=a.equipment[d.slot];take(a,id);add(a,old); }else take(a,id);a.equipment[d.slot]=id;if(d.style)a.style=d.style;return true;}
export function price(s,id,buy=true){const d=ITEMS[id],stock=s.stock[id]||0;return Math.max(1,Math.round(d.value*(buy?1.1+.25/(1+stock):.65)));}
export function transact(s,a,id,buy=true,n=1){if(!ITEMS[id]||n<1||!Number.isInteger(n))return false;const market=facility(s,a,'market');if(!market||distance(a,market)>1.5)return false;
 for(let i=0;i<n;i++){const p=price(s,id,buy);if(buy){if(!(s.stock[id]>0)||a.gold<p||slots(a)>=CAP&&!ITEMS[id].stack)return i>0;if(!add(a,id))return i>0;a.gold-=p;s.stock[id]--;}else{if(!take(a,id))return i>0;a.gold+=p;s.stock[id]=(s.stock[id]||0)+1;}tax(s,p);}return true;}
export function deposit(a){for(const [id,n]of Object.entries(a.inv))add(a,id,n,true);a.inv={};}
export function withdraw(a,id,n=1){let q=Math.min(count(a,id,true),n);let taken=add(a,id,q);if(taken)take(a,id,taken,true);return taken;}
function food(a){return Object.keys(a.inv).filter(id=>ITEMS[id].heal).sort((a,b)=>ITEMS[b].heal-ITEMS[a].heal)[0];}
function eat(s,a){let id=food(a);if(!id)return false;take(a,id);a.hp=Math.min(maxhp(a),a.hp+ITEMS[id].heal);fx(s,a.x,a.y,'+'+ITEMS[id].heal,'#95d195');a.cooldown=Math.max(a.cooldown,1);return true;}
function supplyFromBank(a){for(let [id,q]of Object.entries(a.bank).filter(([id])=>ITEMS[id].heal))if(slots(a)<CAP)withdraw(a,id,Math.min(5,q));for(let id of ['mana','power','restore','arrow'])withdraw(a,id,id==='arrow'?80:2);}
function bankTrip(s,a){const b=facility(s,a,'bank');if(!b)return false;task(s,a,'bank',b,'Banking loot and restocking supplies');return true;}
function rest(s,a){let b=facility(s,a,'tavern')||facility(s,a,'bank');if(b){task(s,a,'rest',b,'Recovering before the next expedition');return true;}task(s,a,'rest',null,'Resting in the field');return true;}
function chooseMonster(s,a,explicit){let candidates=s.monsters.filter(m=>{let d=MONSTERS[m.type];return (!explicit||m.type===explicit)&&(!d.slayer||level(a.xp.Slayer)>=d.slayer)&&(canRisk(s,a)||!wild(s,m))&&d.level<=Math.max(5,level(a.xp[a.style])*1.25+(ITEMS[a.equipment.weapon]?.power||0)*2);});if(a.slayer&&!explicit){let v=candidates.filter(m=>m.type===a.slayer.type);if(v.length)candidates=v;}return nearest(s,a,candidates);}
function pickGather(s,a,skill,type){let nodes=s.nodes.filter(n=>{let d=RESOURCES[n.type];return (!type||type===n.type)&&d.skill===skill&&d.req<=level(a.xp[skill])&&n.charges>0&&(canRisk(s,a)||!wild(s,n));});nodes.sort((b,c)=>RESOURCES[c.type].tier-RESOURCES[b.type].tier);let best=nodes[0]?RESOURCES[nodes[0].type].tier:0;return nearest(s,a,nodes.filter(n=>RESOURCES[n.type].tier>=best-1));}
function findMaterial(s,a,id,need=1){if(count(a,id,true)>0&&facility(s,a,'bank'))return bankTrip(s,a);let n=nearest(s,a,s.nodes.filter(n=>RESOURCES[n.type].out===id&&n.charges>0&&RESOURCES[n.type].req<=level(a.xp[RESOURCES[n.type].skill])&&(canRisk(s,a)||!wild(s,n))));if(n){task(s,a,'gather',n,'Gathering '+ITEMS[id].name+' for production',{material:id,need});return true;}let precursor=RECIPES.find(r=>r.out===id&&r.req<=level(a.xp[r.skill]));if(precursor)return planRecipe(s,a,precursor,1);if(s.stock[id]>0&&a.gold>=price(s,id)){let b=facility(s,a,'market');if(b){task(s,a,'buy',b,'Buying '+ITEMS[id].name,{item:id});return true;}}return false;}
function planRecipe(s,a,r,depth=0){if(depth>3)return false;let b=facility(s,a,r.station);if(!b)return false;let missing=Object.entries(r.input).find(([id,n])=>count(a,id)<n);if(missing){let [id,need]=missing;if(count(a,id,true)>0&&facility(s,a,'bank')){task(s,a,'materials',facility(s,a,'bank'),'Collecting crafting materials',{recipe:r.id});return true;}if(RECIPES.find(p=>p.out===id)?.id===r.id)return false;return findMaterial(s,a,id,need);}task(s,a,'craft',b,'Making '+ITEMS[r.out].name,{recipe:r.id});return true;}
function production(s,a,skill,recipeId){let list=RECIPES.filter(r=>r.skill===skill&&r.req<=level(a.xp[skill])&&facility(s,a,r.station));if(recipeId)list=list.filter(r=>r.id===recipeId);let ready=list.filter(r=>Object.entries(r.input).every(([id,n])=>count(a,id)>=n)).sort((b,c)=>c.req-b.req);if(ready.length){let r=choose(s,ready.slice(0,3));a.project=r.id;return planRecipe(s,a,r);}list.sort((b,c)=>c.req-b.req);for(let r of list.slice(0,5))if(planRecipe(s,a,r)){a.project=r.id;return true;}return false;}
function marketTrip(s,a){let b=facility(s,a,'market');if(!b)return false;task(s,a,'market',b,'Selling surplus and looking for upgrades');return true;}
export function order(s,a,kind,value=null,risk=false){a.order=kind==='auto'?null:{kind,value,risk};a.project=null;a.task=null;a.target=null;a.path=[];a.decide=0;a.reason=kind==='auto'?'Choosing my own next goal':'Following your '+kind+' order';log(s,`${a.name}: ${a.reason}.`,'order');}
function decide(s,a){a.decide=s.tick+10;
 const grave=s.graves.find(g=>g.owner===a.id&&!g.recovery&&g.locked<=s.tick);if(grave&&a.hp>=maxhp(a)*.75&&!wild(s,grave)){task(s,a,'grave',grave,'Recovering my gravestone');return;}
 if(slots(a)>=CAP-3){if(marketTrip(s,a))return;if(bankTrip(s,a))return;}
 if(a.hp<maxhp(a)*.5&&!food(a)){if(Object.keys(a.bank).some(id=>ITEMS[id].heal)&&bankTrip(s,a))return;if(a.gold>=10&&marketTrip(s,a))return;rest(s,a);return;}
 if(a.hp<maxhp(a)*.3){rest(s,a);return;}
 if(a.style==='Magic'&&a.mana<5){if(count(a,'mana')){take(a,'mana');a.mana=Math.min(maxmana(a),a.mana+30);}else{rest(s,a);return;}}
 if(a.inv.bone>=5&&facility(s,a,'altar')){task(s,a,'prayer',facility(s,a,'altar'),'Offering bones at the shrine');return;}
 if(a.style==='Ranged'&&!count(a,'arrow')&&s.stock.arrow>0&&marketTrip(s,a))return;
 const o=a.order;
 if(!o&&a.hp>maxhp(a)*.8&&food(a)&&s.tick>(a.riskUntil||0)&&rng(s)<({Explorer:.35,Hunter:.3,Warrior:.25,Miner:.12,Mage:.15,Ranger:.18}[a.trait]||.05)){if(slots(a)>12&&bankTrip(s,a))return;a.riskUntil=s.tick+140;}
 if(a.project&&!o){let project=RECIPES.find(r=>r.id===a.project);if(project&&planRecipe(s,a,project))return;a.project=null;}
 if(o?.kind==='move'&&o.value&&pathfind(s,a,o.value)!==null){task(s,a,'move',o.value,'Travelling to your destination');return;}
 if(o?.kind==='bank'&&bankTrip(s,a))return;
 if(o?.kind==='rest'){rest(s,a);return;}
 if(o?.kind==='market'&&marketTrip(s,a))return;
 if(o?.kind==='gather'){let d=RESOURCES[o.value],skill=d?.skill||o.value,n=pickGather(s,a,skill,d?o.value:null);if(n){task(s,a,'gather',n,'Following order: '+RESOURCES[n.type].name);return;}}
 if(o?.kind==='craft'){let r=RECIPES.find(r=>r.id===o.value);if(r&&r.req<=level(a.xp[r.skill])){a.project=r.id;if(planRecipe(s,a,r))return;}}
 if(o?.kind==='prayer'&&facility(s,a,'altar')){if(count(a,'bone')){task(s,a,'prayer',facility(s,a,'altar'),'Training Prayer');return;}}
 if(o?.kind==='fight'||o?.kind==='slayer'){if(o.kind==='slayer'&&!a.slayer&&facility(s,a,'slayer')){task(s,a,'slayer',facility(s,a,'slayer'),'Collecting a Slayer assignment');return;}let m=chooseMonster(s,a,o.kind==='fight'?o.value:a.slayer?.type);if(m){task(s,a,'fight',m,'Hunting '+MONSTERS[m.type].name);return;}}
 if(o?.kind==='pk'||!o&&a.trait==='PKer'&&rng(s)<.7){let targets=s.actors.filter(b=>b.id!==a.id&&wild(s,b)&&s.tick>b.retreat&&Math.abs(combatLevel(a)-combatLevel(b))<=5+Math.floor((12-Math.min(12,b.y))/2)&&b.hp>0);let victim=nearest(s,a,targets);if(victim&&a.hp>maxhp(a)*.7){a.skull=s.tick+500;task(s,a,'pk',victim,'Hunting '+victim.name+' in the Wilderness');return;}let wildNodes=s.nodes.filter(n=>wild(s,n)&&n.charges>0&&RESOURCES[n.type].req<=level(a.xp[RESOURCES[n.type].skill]));let n=nearest(s,a,wildNodes);if(n){task(s,a,'gather',n,'Taking a risk on frontier resources');return;}}
 if(a.gold>130&&s.tick-a.lastMarket>100&&marketTrip(s,a))return;
 const preferred={Angler:'Fishing',Miner:'Mining',Lumberjack:'Woodcutting',Artisan:rng(s)<.5?'Smithing':'Crafting',Alchemist:'Herblore',Mage:'Magic',Ranger:'Ranged',Warrior:'Melee',Hunter:'Slayer',PKer:'Melee'}[a.trait]||choose(s,['Fishing','Mining','Woodcutting','Melee','Cooking','Crafting']);
 if(['Cooking','Smithing','Crafting','Herblore'].includes(preferred)&&rng(s)<.75&&production(s,a,preferred))return;
 if(['Melee','Magic','Ranged','Slayer'].includes(preferred)||rng(s)<.22){if(preferred==='Slayer'&&!a.slayer&&facility(s,a,'slayer')){task(s,a,'slayer',facility(s,a,'slayer'),'Looking for a Slayer bounty');return;}let m=chooseMonster(s,a);if(m){task(s,a,'fight',m,'Training '+a.style+' on '+MONSTERS[m.type].name);return;}}
 let n=pickGather(s,a,['Fishing','Mining','Woodcutting','Herblore'].includes(preferred)?preferred:choose(s,['Fishing','Mining','Woodcutting','Herblore']));if(n){task(s,a,'gather',n,o?'Order blocked; gathering while waiting':'Training '+RESOURCES[n.type].skill);return;}
 if(Object.keys(a.inv).some(id=>!ITEMS[id].heal)&&marketTrip(s,a))return;
 let b=facility(s,a,'fountain')||facility(s,a,'tavern');task(s,a,'rest',b,'Waiting for reachable resources or enemies');}
function doMarket(s,a){a.lastMarket=s.tick;for(let [id,q]of Object.entries(a.inv)){let d=ITEMS[id];if(d.heal||d.mana||d.buff||d.prayer||id==='arrow'||id==='bone')continue;let r=RECIPES.find(r=>r.id===(a.order?.kind==='craft'?a.order.value:a.project));if(r?.input[id])continue;let keep=['Artisan','Alchemist'].includes(a.trait)?2:0;transact(s,a,id,false,Math.max(0,q-keep));}
 for(let id of Object.keys(a.inv).filter(id=>ITEMS[id].slot))if((ITEMS[id].power||ITEMS[id].def||0)>(ITEMS[a.equipment[ITEMS[id].slot]]?.power||ITEMS[a.equipment[ITEMS[id].slot]]?.def||0))equip(a,id);
 const prefix=a.style==='Magic'?'staff':a.style==='Ranged'?'bow':'sword';for(let slot of ['weapon','armor','amulet']){let candidates=Object.values(ITEMS).filter(d=>d.slot===slot&&(slot!=='weapon'||d.id.startsWith(prefix))&&d.req<=level(a.xp[d.skill])&&s.stock[d.id]>0&&(d.power||d.def||0)>(ITEMS[a.equipment[slot]]?.power||ITEMS[a.equipment[slot]]?.def||0)).sort((b,c)=>c.value-b.value);for(let d of candidates)if(a.gold>=price(s,d.id)+25&&transact(s,a,d.id,true)){equip(a,d.id);a.history.unshift('Bought '+d.name);break;}}
 let foods=Object.values(ITEMS).filter(d=>d.heal&&s.stock[d.id]>0&&d.id.startsWith('food')).sort((b,c)=>c.heal-b.heal);let have=Object.entries(a.inv).reduce((n,[id,q])=>n+(ITEMS[id].heal?q:0),0);for(let d of foods){while(have<5&&a.gold>=price(s,d.id)&&slots(a)<CAP){if(!transact(s,a,d.id,true))break;have++;}if(have>=5)break;}
 if(a.style==='Ranged'&&count(a,'arrow')<20)transact(s,a,'arrow',true,Math.min(60,Math.floor(a.gold/price(s,'arrow'))));
 for(let id of ['mana','health','power','restore'])if(a.gold>200&&count(a,id)<2&&s.stock[id]>0)transact(s,a,id,true);
 a.history=a.history.slice(0,10);a.task=null;
 if(slots(a)>CAP-5)bankTrip(s,a);}
function targetFor(s,t){return t.kind==='pk'?s.actors.find(a=>a.id===t.target):s.monsters.find(m=>m.id===t.target);}
function action(s,a){let t=a.task;if(!t)return;if(s.tick-(t.started??s.tick)>240&&distance(a,{x:a.px,y:a.py})===0&&!['gather','rest','fight','pk'].includes(t.kind)){a.task=null;a.project=null;a.reason='Previous task stalled; finding another route or activity';return;}if(t.kind==='fight'||t.kind==='pk'){let target=targetFor(s,t);if(!target||target.hp<=0||t.kind==='pk'&&!wild(s,target)){a.task=null;return;}if(s.tick<a.retreat){a.task=null;return;}let range=a.style==='Melee'?1.5:5;if(t.kind==='pk'&&!wild(s,a)){move(s,a,target,0);return;}if(distance(a,target)>range){move(s,a,target,range);return;}if(a.cooldown>0)return;
 if(a.style==='Magic'&&a.mana<3){if(count(a,'mana')){take(a,'mana');a.mana=Math.min(maxmana(a),a.mana+30);}else{a.retreat=s.tick+30;rest(s,a);return;}}
 if(a.style==='Ranged'&&!count(a,'arrow')){a.retreat=s.tick+15;a.task=null;return;}
 let weapon=ITEMS[a.equipment.weapon],power=(weapon?.style===a.style?weapon.power:1)+(ITEMS[a.equipment.amulet]?.power||0),lvl=level(a.xp[a.style]);let def=t.kind==='pk'?defense(target):MONSTERS[target.type].def;let accuracy=clamp(.65+(lvl-(t.kind==='pk'?combatLevel(target):MONSTERS[target.type].level))*.008,.25,.95);let buff=a.buff>s.tick?1.2:1;let damage=rng(s)<accuracy?Math.max(0,Math.floor(rng(s)*(3+lvl*.32+power)*buff+(a.prayerOn?2:0)-def*.3)):0;
 if(a.style==='Magic')a.mana-=3;if(a.style==='Ranged')take(a,'arrow');a.cooldown=a.style==='Magic'?5:a.style==='Ranged'?4:3;a.target=target.id;target.lastHit=a.id;if(t.kind==='pk')target.attacker=a.id;else target.target=a.id;
 fx(s,a.x,a.y,'',a.style==='Magic'?'#aeb8ff':a.style==='Ranged'?'#d8d2a0':'#fff2cf',a.style==='Melee'?'slash':'projectile',{x:target.x,y:target.y});hurt(s,target,damage,t.kind==='pk');gain(s,a,a.style,Math.max(1,damage)*4);gain(s,a,'HP',Math.max(1,damage));if(target.hp<=0){if(t.kind==='pk'){a.pk++;s.stats.pk++;death(s,target,a);}else kill(s,a,target);a.task=null;}return;}
 if(t.kind==='move'){if(move(s,a,t.target)){a.task=null;a.order=null;}return;}
 let obj=t.kind==='gather'?s.nodes.find(n=>n.id===t.target):t.kind==='grave'?s.graves.find(g=>g.id===t.target):s.buildings.find(b=>b.id===t.target);
 if(t.kind==='rest'&&!obj){a.hp=Math.min(maxhp(a),a.hp+1);a.mana=Math.min(maxmana(a),a.mana+2);if(a.hp>=maxhp(a)&&a.mana>=maxmana(a))a.task=null;return;}
 if(!obj){a.task=null;return;}if(!move(s,a,obj,t.kind==='gather'?1.5:1))return;
 if(t.kind==='gather'){const d=RESOURCES[obj.type];if(!obj.charges||d.req>level(a.xp[d.skill])||slots(a)>=CAP){a.task=null;return;}if(++a.busy>=Math.max(2,5+d.tier-Math.floor(level(a.xp[d.skill])/20))){a.busy=0;if(add(a,d.out)){if(t.material&&count(a,t.material)>=t.need)a.task=null;obj.charges--;if(!obj.charges)obj.ready=s.tick+d.respawn;gain(s,a,d.skill,d.xp);s.stats.gathered++;fx(s,a.x,a.y,'+1 '+ITEMS[d.out].name,'#a7cb91');if(rng(s)<.02)add(a,'gem');}}return;}
 if(t.kind==='craft'){let r=RECIPES.find(r=>r.id===t.recipe);if(!r||!Object.entries(r.input).every(([id,n])=>count(a,id)>=n)){a.task=null;return;}if(++a.busy>=5){a.busy=0;for(let [id,n]of Object.entries(r.input))take(a,id,n);add(a,r.out,r.count);gain(s,a,r.skill,r.xp);s.stats.crafted++;s.treasury+=2;fx(s,a.x,a.y,'Made '+ITEMS[r.out].name,'#b7cbef');if(ITEMS[r.out].slot)equip(a,r.out);if(a.project===r.id)a.project=null;a.task=null;}return;}
 if(t.kind==='market'){doMarket(s,a);return;}
 if(t.kind==='buy'){transact(s,a,t.item,true);a.task=null;return;}
 if(t.kind==='materials'){let r=RECIPES.find(r=>r.id===t.recipe);if(r)for(let [id,n]of Object.entries(r.input))withdraw(a,id,Math.max(0,n-count(a,id)));a.task=null;return;}
 if(t.kind==='bank'){deposit(a);supplyFromBank(a);a.task=null;if(a.order?.kind==='bank')a.order=null;return;}
 if(t.kind==='rest'){a.hp=Math.min(maxhp(a),a.hp+3);a.mana=Math.min(maxmana(a),a.mana+4);if(a.hp>=maxhp(a)&&a.mana>=maxmana(a)){a.task=null;if(a.order?.kind==='rest')a.order=null;}return;}
 if(t.kind==='prayer'){if(count(a,'bone')){take(a,'bone');gain(s,a,'Prayer',25);}else{a.prayer=maxprayer(a);a.task=null;}return;}
 if(t.kind==='slayer'){const options=s.spawns.filter(p=>MONSTERS[p.type].level<=Math.max(5,level(a.xp[a.style])*1.2+(ITEMS[a.equipment.weapon]?.power||0)*2)&&(!MONSTERS[p.type].slayer||MONSTERS[p.type].slayer<=level(a.xp.Slayer))&&(canRisk(s,a)||!wild(s,p)));if(options.length){let p=choose(s,options),q=8+Math.floor(rng(s)*8);a.slayer={type:p.type,left:q,total:q};a.reason='Assigned '+q+' '+MONSTERS[p.type].name;log(s,`${a.name} accepted a Slayer task: ${q} ${MONSTERS[p.type].name}.`,'slayer');}a.task=null;return;}
 if(t.kind==='grave'){for(let [id,q]of Object.entries(obj.items)){let n=add(a,id,q);obj.items[id]-=n;if(!obj.items[id])delete obj.items[id];}if(!Object.keys(obj.items).length)s.graves=s.graves.filter(g=>g.id!==obj.id);else bankTrip(s,a);if(a.task===t)a.task=null;}
}
function defense(a){return (ITEMS[a.equipment.armor]?.def||0)+(ITEMS[a.equipment.amulet]?.def||0)+level(a.xp.HP)*.05;}
function hurt(s,target,n,isActor){if(isActor&&target.prayerOn)n=Math.floor(n*.7);target.hp=Math.max(0,target.hp-n);fx(s,target.x,target.y,n?String(n):'0',n?'#ffb7a7':'#9fc1dd','hit');}
function kill(s,a,m){const d=MONSTERS[m.type];a.kills++;s.stats.kills++;if(d.boss){s.stats.bosses++;log(s,`${a.name} defeated ${d.name}!`,'boss');}let gold=d.gold[0]+Math.floor(rng(s)*(d.gold[1]-d.gold[0]+1));a.gold+=gold;s.treasury+=Math.max(1,Math.floor(gold*.1));add(a,'bone');for(let [id,chance]of d.drops)if(rng(s)<chance){if(!add(a,id))s.loot.push({id:s.nextId++,x:m.x,y:m.y,items:{[id]:1},owner:a.id,unlock:s.tick+20,expires:s.tick+300});else if(ITEMS[id].slot){equip(a,id);log(s,`${a.name} found ${ITEMS[id].name} on ${d.name}.`,'loot');}}
 if(a.slayer?.type===m.type){a.slayer.left--;gain(s,a,'Slayer',d.xp*3);if(a.slayer.left<=0){a.gold+=120+d.level*5;a.slayerPoints+=10;gain(s,a,'Slayer',100+d.level*5);log(s,`${a.name} completed a Slayer assignment.`,'slayer');a.slayer=null;}}
 let p=s.spawns.find(p=>p.id===m.spawn);if(p)p.ready=s.tick+(d.boss?180:25);s.monsters=s.monsters.filter(q=>q.id!==m.id);fx(s,m.x,m.y,'+'+gold+'g','#edd388');}
export function death(s,a,killer=null){a.deaths++;let items={...a.inv};a.inv={};if(wild(s,a)){for(let id of Object.values(a.equipment).filter(Boolean))items[id]=(items[id]||0)+1;a.equipment={weapon:null,armor:null,amulet:null};let keep=s.tick<a.skull?1:3;let valuable=Object.entries(items).flatMap(([id,q])=>Array.from({length:ITEMS[id].stack?1:q},()=>({id,value:ITEMS[id].value*(ITEMS[id].stack?q:1)}))).sort((b,c)=>c.value-b.value);for(let v of valuable.slice(0,keep)){let n=ITEMS[v.id].stack?items[v.id]:1;add(a,v.id,n);items[v.id]-=n;if(!items[v.id])delete items[v.id];equip(a,v.id);}if(Object.keys(items).length)s.loot.push({id:s.nextId++,x:a.x,y:a.y,items,owner:killer?.id??a.id,unlock:s.tick+40,expires:s.tick+800});log(s,`${a.name} fell in the Wilderness${killer?' to '+killer.name:''} and dropped belongings.`,'death');}
 else{if(Object.keys(items).length)s.graves.push({id:s.nextId++,owner:a.id,x:a.x,y:a.y,items,created:s.tick,locked:s.tick+15,recovery:false});log(s,`${a.name} died. Their belongings await at a private gravestone.`,'death');}
 let b=s.buildings.find(b=>b.type==='bank')||{x:39,y:34};a.x=b.x;a.y=b.y+1;a.px=a.x;a.py=a.y;a.hp=maxhp(a);a.mana=maxmana(a);a.prayer=maxprayer(a);a.task=null;a.path=[];a.target=null;a.retreat=s.tick+35;a.attacker=null;a.skull=0;a.history.unshift('Died at tick '+s.tick);a.history=a.history.slice(0,10);}
export function recover(s,a,id){let g=s.graves.find(g=>g.id===id&&g.owner===a.id&&g.recovery),b=facility(s,a,'bank');if(!g||!b||distance(a,b)>1.5||a.gold<15)return false;a.gold-=15;for(let [id,q]of Object.entries(g.items))add(a,id,q,true);s.graves=s.graves.filter(v=>v!==g);return true;}
function monsterStep(s,m){const d=MONSTERS[m.type],home=s.spawns.find(p=>p.id===m.spawn);if(!home)return;let a=s.actors.find(a=>a.id===m.target);if(!a&&d.aggro)a=s.actors.find(a=>s.tick>a.retreat&&distance(a,m)<3&&(wild(s,m)||d.level>=12));if(a&&(a.hp<=0||distance(a,home)>12||s.tick<a.retreat)){a=null;m.target=null;}
 if(a){m.target=a.id;if(distance(m,a)>1.5)move(s,m,a,1.5);else if(m.cooldown<=0){m.cooldown=d.boss?5:4;let damage=rng(s)<.78?Math.max(0,Math.floor(rng(s)*(d.max+1)-defense(a)*.35)):0;hurt(s,a,damage,true);a.attacker=m.id;if(!a.task||!['fight','pk'].includes(a.task.kind)){if(a.hp>maxhp(a)*.5)task(s,a,'fight',m,'Defending against '+d.name);else rest(s,a);}if(a.hp<=0)death(s,a);}}
 else if(distance(m,home)>2){move(s,m,home,1);m.hp=Math.min(d.hp,m.hp+2);}else if(s.tick%15===0){let x=m.x+Math.floor(rng(s)*3)-1,y=m.y+Math.floor(rng(s)*3)-1;if(walkable(s,x,y)&&distance({x,y},home)<3){m.x=x;m.y=y;}}m.cooldown=Math.max(0,m.cooldown-1);}
export function merit(s){return MILESTONES.filter((m,i)=>s.milestones.includes(i)||m.test(s)).length;}
export function tick(s){s.tick++;s.seed=s.seed>>>0;s.effects=s.effects.filter(e=>s.tick-e.tick<4);
 for(const n of s.nodes)if(n.charges===0&&s.tick>=n.ready)n.charges=RESOURCES[n.type].capacity;
 for(const p of s.spawns)if(!s.monsters.some(m=>m.spawn===p.id)&&s.tick>=p.ready)spawn(s,p);
 for(const a of s.actors){a.px=a.x;a.py=a.y;a.cooldown=Math.max(0,a.cooldown-1);if(s.tick%10===0){a.mana=Math.min(maxmana(a),a.mana+2);if(!a.task||!['fight','pk'].includes(a.task.kind))a.hp=Math.min(maxhp(a),a.hp+1);}if(a.prayerOn){if(s.tick%5===0)a.prayer=Math.max(0,a.prayer-1);if(!a.prayer)a.prayerOn=false;}
 if(a.hp<maxhp(a)*.55&&food(a)&&a.cooldown<=1)eat(s,a);
 if(count(a,'power')&&a.task&&['fight','pk'].includes(a.task.kind)&&!(a.buff>s.tick)){take(a,'power');a.buff=s.tick+100;}
 if(a.hp<maxhp(a)*.25&&!food(a)&&s.tick>a.retreat){a.retreat=s.tick+40;rest(s,a);}
 if(typeof a.attacker==='number'&&wild(s,a)&&a.hp>maxhp(a)*.4){let enemy=s.actors.find(b=>b.id===a.attacker);if(enemy&&wild(s,enemy)&&distance(a,enemy)<7&&a.task?.kind!=='pk')task(s,a,'pk',enemy,'Defending against '+enemy.name);}
 if(!walkable(s,Math.floor(a.x),Math.floor(a.y))){let safe=null;for(let rr=1;rr<8&&!safe;rr++)for(let dx=-rr;dx<=rr&&!safe;dx++)for(let dy=-rr;dy<=rr;dy++)if(walkable(s,Math.floor(a.x)+dx,Math.floor(a.y)+dy)){safe={x:Math.floor(a.x)+dx,y:Math.floor(a.y)+dy};break;}if(safe){a.x=safe.x;a.y=safe.y;a.path=[];}}if(!a.task)decide(s,a);action(s,a);
 for(let loot of s.loot){if(distance(a,loot)<1.5&&(loot.owner===a.id||s.tick>=loot.unlock)){for(let [id,q]of Object.entries(loot.items)){let n=add(a,id,q);loot.items[id]-=n;if(!loot.items[id])delete loot.items[id];}}}
 if(a.task?.kind==='gather'&&s.tick%70===a.id%70&&!a.order)a.task=null;
 if(s.tick%180===a.id%180&&!a.order&&slots(a)<CAP-3)a.task=null;
 }
 for(const m of [...s.monsters]){m.px=m.x;m.py=m.y;monsterStep(s,m);}
 s.loot=s.loot.filter(l=>s.tick<l.expires&&Object.keys(l.items).length);for(let g of s.graves)if(s.tick-g.created>=600)g.recovery=true;
 for(let i=0;i<MILESTONES.length;i++)if(!s.milestones.includes(i)&&MILESTONES[i].test(s)){s.milestones.push(i);s.treasury+=300;s.arrival+=5;log(s,'Milestone: '+MILESTONES[i].name+'. Five adventurers are on their way. +300 realm gold.','milestone');}
 if(s.arrival>0&&s.tick%12===0&&s.actors.length<50){let id=s.actors.length,l=Math.max(1,Math.min(25,s.milestones.length*2));let a=actor(s,id,l);a.x=39;a.y=H-3;s.actors.push(a);s.arrival--;log(s,`${a.name}, a ${a.trait.toLowerCase()}, arrived in the realm.`,'arrival');}
 if(s.tick%100===0){s.treasury+=15+s.buildings.filter(b=>b.type==='tavern'||b.type==='market').length*3;for(let id of ['food0','food1','health','mana','arrow'])s.stock[id]=Math.min(ITEMS[id].stack?2000:30,(s.stock[id]||0)+(id==='arrow'?200:4));for(let t=0;t<=unlockedTier(s);t++)for(let prefix of ['sword','bow','staff','armor'])s.stock[prefix+t]=Math.min(3,(s.stock[prefix+t]||0)+1);}
}
export function validate(s){
 if(s.version!==VERSION||s.terrain?.length!==W*H||s.wild?.length!==W*H||!Array.isArray(s.actors)||s.actors.length<1||s.actors.length>50||!Number.isFinite(s.treasury)||s.treasury<0||!Number.isFinite(s.tick)||s.tick<0||!Number.isFinite(s.seed))throw Error('Invalid realm save');
 for(let key of ['buildings','nodes','spawns','monsters','graves','loot','milestones','log'])if(!Array.isArray(s[key]))throw Error('Invalid '+key);
 if(!s.settings||![1,2,4].includes(s.settings.speed)||!s.stats||!Number.isFinite(s.nextId)||!Number.isFinite(s.arrival)||!s.stock||typeof s.name!=='string'||s.name.length>80)throw Error('Invalid realm metadata');
 if(s.terrain.some(t=>!['grass','path','water','stone','sand','ash'].includes(t))||s.wild.some(v=>typeof v!=='boolean'))throw Error('Invalid terrain');
 const pos=o=>Number.isFinite(o.x)&&Number.isFinite(o.y)&&o.x>=0&&o.x<W&&o.y>=0&&o.y<H;
 const bag=b=>{if(!b||Array.isArray(b))throw Error('Invalid inventory');for(let [id,n]of Object.entries(b))if(!ITEMS[id]||!Number.isInteger(n)||n<1)throw Error('Invalid inventory');};
 if(new Set(s.actors.map(a=>a.id)).size!==s.actors.length||s.actors[0].id!==0)throw Error('Invalid adventurer identity');
 for(let a of s.actors){if(!a.equipment||!Number.isFinite(a.gold)||a.gold<0||!Number.isFinite(a.hp)||a.hp<0||!Number.isFinite(a.mana)||!Number.isFinite(a.prayer)||!pos(a)||!['Melee','Magic','Ranged'].includes(a.style)||typeof a.name!=='string'||!Array.isArray(a.history))throw Error('Invalid adventurer');for(let k of SKILLS)if(!Number.isFinite(a.xp[k])||a.xp[k]<0)throw Error('Invalid skill');bag(a.inv);bag(a.bank);for(let id of Object.values(a.equipment))if(id&&!ITEMS[id])throw Error('Invalid equipment');if(slots(a)>CAP)throw Error('Inventory overflow');}
 for(let [key,defs]of [['buildings',BUILDINGS],['nodes',RESOURCES],['spawns',MONSTERS],['monsters',MONSTERS]])for(let o of s[key])if(!defs[o.type]||!pos(o))throw Error('Invalid '+key);
 for(let g of [...s.graves,...s.loot]){if(!pos(g))throw Error('Invalid dropped belongings');bag(g.items);}
 for(let n of Object.values(s.stats))if(!Number.isFinite(n)||n<0)throw Error('Invalid realm statistics');
 return true;
}
export function serialize(s){const out=JSON.parse(JSON.stringify(s));out.effects=[];for(let a of out.actors)a.path=[];return JSON.stringify(out);}
export function deserialize(text){let s=JSON.parse(text);validate(s);s.effects=[];return s;}
