import assert from 'node:assert/strict';
import {paletteIntent,paintSegment} from './editor.js';
import {fresh,openRealm,tick,place,idx,serialize,deserialize} from './engine.js';
assert.equal(paletteIntent(4,-4,true),null);
assert.equal(paletteIntent(40,-10,true),'scroll');
assert.equal(paletteIntent(0,-25,true),'drag');
assert.equal(paletteIntent(0,-25,false),'ignore');
assert.equal(paletteIntent(0,25,true),'ignore');
let line=paintSegment({x:1,y:1},{x:10,y:7});assert.equal(line.length,10);assert.deepEqual(line[0],{x:1,y:1});assert.deepEqual(line.at(-1),{x:10,y:7});
let s=fresh();assert(s.terrain.every(t=>t==='grass'));assert.equal(s.settings.open,false);assert(!openRealm(s).ok);s.treasury=500;let before=serialize(s);place(s,'building','gate',12,20);assert(openRealm(s).ok);assert(s.actors.every(a=>Math.abs(a.x-12)<8&&Math.abs(a.y-20)<8));tick(s);assert.equal(s.tick,1);let undo=deserialize(before);assert(undo.terrain.every(t=>t==='grass'));assert.equal(undo.buildings.length,0);assert.equal(undo.settings.open,false);
// Water can be painted anywhere before admission; waiting actors do not reserve hidden tiles.
assert(place(undo,'terrain','water',37,33).ok);assert.equal(undo.terrain[idx(37,33)],'water');
assert(place(undo,'building','gate',5,5).ok);assert(!place(undo,'building','gate',10,10).ok);
console.log('PASS editor gesture intent, continuous brush interpolation, blank-world lifecycle, chosen arrival location, pre-admission water and unique gate');
