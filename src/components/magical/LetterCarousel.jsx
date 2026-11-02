import { useEffect,useRef } from 'react';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import Envelope from './Envelope';

export default function LetterCarousel({letters,selected,setSelected,read,onChoose}) {
 const single=letters.length===1;
 const rail=useRef(null), gesture=useRef(null), suppressClick=useRef(false);
 useEffect(()=>{
  const container=rail.current, envelope=container?.children[selected];
  // Scroll only the rail; scrollIntoView also shifted the desk and clipped reading controls.
  if(envelope)container.scrollTo({left:envelope.offsetLeft-(container.clientWidth-envelope.offsetWidth)/2,behavior:'smooth'});
 },[selected]);
 const down=e=>{
  if(!e.isPrimary||e.button!==0)return;
  suppressClick.current=false;
  gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,left:rail.current.scrollLeft,dragged:false};
 };
 const move=e=>{
  const current=gesture.current;
  if(!current||current.id!==e.pointerId)return;
  if(!(e.buttons&1)){gesture.current=null;return}
  const distance=e.clientX-current.x;
  if(!current.dragged){
   if(Math.abs(distance)<=6||Math.abs(distance)<Math.abs(e.clientY-current.y))return;
   current.dragged=true;
   // Capturing a normal tap here would redirect its click away from the envelope button.
   rail.current.setPointerCapture(e.pointerId);
  }
  rail.current.scrollLeft=current.left-distance*1.25;
 };
 const up=e=>{
  const current=gesture.current;
  if(!current||current.id!==e.pointerId)return;
  suppressClick.current=current.dragged&&e.type!=='pointercancel';
  gesture.current=null;
  if(rail.current.hasPointerCapture(e.pointerId))rail.current.releasePointerCapture(e.pointerId);
 };
 const click=e=>{
  if(suppressClick.current&&e.detail!==0){e.preventDefault();e.stopPropagation()}
  suppressClick.current=false;
 };
 return <section className="browse-scene">
  <header className="desk-heading"><span>Correspondence</span><h1>{single?'A letter to inspect':'Choose a letter to inspect'}</h1>{single?null:<p>Drag across the desk · Select an envelope to bring it closer</p>}</header>
  <div ref={rail} className="letter-rail" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClickCapture={click}>
   {letters.map((l,i)=><div className="envelope-slot" key={l.id}><Envelope letter={l} index={i} selected={selected===i} read={read.has(l.id)} onSelect={setSelected}/><button className="envelope-label" onClick={()=>setSelected(i)}>{String(i+1).padStart(2,'0')} — {l.name}</button></div>)}
  </div>
  {single?null:<><button className="brass-arrow left" aria-label="Previous letter" onClick={()=>setSelected(Math.max(0,selected-1))}><ChevronLeft/></button><button className="brass-arrow right" aria-label="Next letter" onClick={()=>setSelected(Math.min(letters.length-1,selected+1))}><ChevronRight/></button></>}
  <button className="inspect-action" onClick={onChoose}>Inspect &amp; open</button>
 </section>;
}
