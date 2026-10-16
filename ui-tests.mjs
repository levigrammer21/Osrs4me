// Headless JS integration checks, without a browser or layout engine.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const nodes=new Map(),all=[];
class El{
 constructor(id='',attrs={}){this.id=id;this.dataset={};this.listeners={};this.hidden=false;this.open=false;this.value='';this.tagName='DIV';this.checked=false;this.classList={add:()=>{},remove:()=>{},toggle:()=>{}};this.style={};this.children=[];for(let [k,v]of Object.entries(attrs)){if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;}all.push(this);if(id)nodes.set(id,this);}
 set innerHTML(v){this._html=v;parse(v);}get innerHTML(){return this._html||'';}addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}dispatch(name,event){for(let fn of this.listeners[name]||[])fn(event);}closest(){return this;}getBoundingClientRect(){return {x:0,y:0,left:0,top:0,width:1024,height:620};}setPointerCapture(){}showModal(){this.open=true;}close(){this.open=false;}append(v){this.children.push(v);}remove(){}click(){}getContext(){return ctx;}setAttribute(){}
}
function parse(text){for(let m of text.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)){let attrs={};for(let a of m[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];if(attrs.id&&nodes.has(attrs.id))continue;let el=new El(attrs.id||'',attrs);el.tagName=m[1].toUpperCase();}}
const ctx=new Proxy({measureText:t=>({width:String(t).length*.2}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...a)=>{},set:(o,k,v)=>(o[k]=v,true)});
parse(fs.readFileSync(new URL('./index.html',import.meta.url),'utf8'));
globalThis.document={getElementById:id=>nodes.get(id),querySelectorAll:selector=>selector==='.speed'?all.filter(e=>e.dataset.speed):all.filter(e=>e.dataset[selector.match(/data-([\w-]+)/)?.[1]?.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]!==undefined),createElement:()=>new El(),activeElement:{tagName:'BODY'},hidden:false,addEventListener(){}};
globalThis.window={addEventListener(){}};globalThis.innerWidth=1024;globalThis.devicePixelRatio=1;globalThis.ResizeObserver=class{observe(){}};let frames=[];globalThis.requestAnimationFrame=fn=>frames.push(fn);let storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.location={protocol:'http:'};
const realTimeout=globalThis.setTimeout;globalThis.setTimeout=()=>0;
await import('./app.js');assert(nodes.get('modal').open);assert(nodes.get('modal-content').innerHTML.includes('data-start'));
const click=(id,data)=>{const el=new El('',Object.fromEntries(Object.entries(data).map(([k,v])=>['data-'+k,String(v)])));const e={target:el};let node=nodes.get(id);if(node.onclick)node.onclick(e);node.dispatch('click',e);};
click('modal-content',{start:'starter'});assert(!nodes.get('modal').open);assert(storage.has('realmstead.v1'));
for(let name of ['overview','skills','inventory','tasks','recipes','bank','market','slayer']){nodes.get('my-status').onclick();click('modal-content',{tab:name,actor:0});assert(nodes.get('modal-content').innerHTML.length>100);assert(nodes.get('modal').open);nodes.get('close-modal').onclick();}
for(let id of ['population','progress','funds','settings','help','feed-peek']){nodes.get(id).onclick();assert(nodes.get('modal').open);nodes.get('close-modal').onclick();}
for(let category of ['terrain','building','resource','monster','decor']){click('categories',{category});assert(nodes.get('palette').innerHTML.includes('build-card'));}
click('palette',{build:'tree0',kind:'resource'});
let canvas=nodes.get('world');canvas.onpointerdown({pointerId:1,button:0,buttons:1,pointerType:'mouse',clientX:400,clientY:330});canvas.onpointerup({pointerId:1,button:0,pointerType:'mouse',clientX:400,clientY:330});nodes.get('undo').onclick();nodes.get('redo').onclick();nodes.get('inspect').onclick();
// Advance app frames through real simulation, renderer and HUD code.
let now=performance.now();for(let i=0;i<240;i++){const fn=frames.pop();frames=[];fn(now+i*100);}assert(nodes.get('gold').textContent);assert(nodes.get('pop').textContent.includes('/ 50'));
console.log('PASS UI module boots, welcome, all character tabs, menus, palettes, construction, undo/redo, autosave and 240 animation frames');
const {fresh,place}=await import('./engine.js');const {Renderer}=await import('./render.js');const {BUILDINGS,RESOURCES,MONSTERS}=await import('./data.js');const s=fresh();let i=0;for(let type of Object.keys(BUILDINGS))place(s,'building',type,30+i++%12,20+Math.floor(i/12),true);i=0;for(let type of Object.keys(RESOURCES))place(s,'resource',type,30+i++%12,25+Math.floor(i/12),true);i=0;for(let type of Object.keys(MONSTERS))place(s,'monster',type,30+i++%12,38+Math.floor(i/12),true);let renderer=new Renderer(canvas);renderer.cam.z=12;renderer.draw(s,.5);renderer.cam.z=66;renderer.draw(s,1);console.log('PASS all content renderer branches execute at minimum and maximum zoom');
globalThis.setTimeout=realTimeout;
