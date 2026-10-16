// Feral Region's gesture model: horizontal browses, deliberate upward drag places.
export function paletteIntent(dx,dy,placeable){if(Math.hypot(dx,dy)<=8)return null;if(Math.abs(dx)>=Math.abs(dy))return 'scroll';if(placeable&&dy<0&&Math.abs(dy)>Math.abs(dx)*1.4)return 'drag';return 'ignore';}
export function paintSegment(from,to){const count=Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y),1),out=[];for(let i=0;i<=count;i++){let p={x:Math.round(from.x+(to.x-from.x)*i/count),y:Math.round(from.y+(to.y-from.y)*i/count)};if(!out.some(v=>v.x===p.x&&v.y===p.y))out.push(p);}return out;}
