import {W,H} from './data.js';
export const COLORS={grass:['#647949','#687d4d','#617646','#6c804f'],path:['#b39e72','#b5a076','#ad986e'],water:['#426f78','#467780','#497982'],stone:['#7b8078','#84877d','#767d76'],sand:['#b4a780','#b8aa82'],ash:['#666363','#696568','#625f61']};
const noise=(x,y)=>((Math.imul(x+74,374761393)^Math.imul(y+31,668265263))>>>0)/4294967295;
export class TerrainLayer{
 constructor(){this.canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(W*16,H*16):document.createElement('canvas');this.canvas.width=W*16;this.canvas.height=H*16;this.ctx=this.canvas.getContext('2d',{alpha:false});this.state=null;this.revision=-1;this.tiles=[];this.wild=[];this.drawn=0;}
 update(s){if(this.state===s&&this.revision===(s.worldRevision||0))return;const full=this.state!==s;let changed=new Set();for(let i=0;i<W*H;i++)if(full||this.tiles[i]!==s.terrain[i]||this.wild[i]!==s.wild[i]){changed.add(i);let x=i%W,y=Math.floor(i/W);for(let [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]])if(x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H)changed.add((y+dy)*W+x+dx);}for(let i of changed)this.tile(s,i%W,Math.floor(i/W));this.tiles=[...s.terrain];this.wild=[...s.wild];this.state=s;this.revision=s.worldRevision||0;}
 tile(s,x,y){const c=this.ctx,kind=s.terrain[y*W+x],n=noise(x,y),pal=COLORS[kind]||COLORS.grass;this.drawn++;c.save();c.scale(16,16);c.translate(x,y);c.fillStyle=pal[Math.floor(n*pal.length)];c.fillRect(0,0,1,1);
 if(kind==='grass'&&n>.25){c.fillStyle=n>.6?'#80905a':'#536a40';c.fillRect(n*.7,.2+n*.5,.035,.1);c.fillRect(.7-n*.5,.6,.08,.035);if(n>.93){c.fillStyle='#d1c38b';c.fillRect(.25,.3,.05,.05);}}
 if(kind==='path'&&n>.6){c.fillStyle='#968665';c.fillRect(.2,.4,.13,.05);}if(kind==='stone'){c.strokeStyle='#69716d';c.lineWidth=.025;c.beginPath();c.moveTo(.1,.3);c.lineTo(.4,.4);c.lineTo(.55,.25);c.stroke();}
 if(kind!=='water'){c.strokeStyle='#a4a77c';c.lineWidth=.07;for(let [dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]])if(x+dx>=0&&x+dx<W&&y+dy>=0&&y+dy<H&&s.terrain[(y+dy)*W+x+dx]==='water'){c.beginPath();if(dx){c.moveTo(dx>0?1:0,0);c.lineTo(dx>0?1:0,1);}else{c.moveTo(0,dy>0?1:0);c.lineTo(1,dy>0?1:0);}c.stroke();}}
 if(s.wild[y*W+x]){c.fillStyle='rgba(91,42,61,.22)';c.fillRect(0,0,1,1);if(!s.wild[(y+1)*W+x]||!s.wild[(y-1)*W+x]||!s.wild[y*W+x+1]||!s.wild[y*W+x-1]){c.strokeStyle='#c17d6e';c.lineWidth=.045;c.setLineDash([.13,.14]);c.strokeRect(.02,.02,.96,.96);}}
 c.restore();}
}
