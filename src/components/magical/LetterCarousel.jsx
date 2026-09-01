import { useEffect,useRef } from 'react';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import Envelope from './Envelope';

export default function LetterCarousel({letters,selected,setSelected,read,onChoose}) {
 const rail=useRef(null), dragging=useRef(false), start=useRef(0), left=useRef(0);
 useEffect(()=>{rail.current?.children[selected]?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})},[selected]);
 const down=e=>{dragging.current=true;start.current=e.clientX;left.current=rail.current.scrollLeft;rail.current.setPointerCapture(e.pointerId)};
 const move=e=>{if(dragging.current)rail.current.scrollLeft=left.current-(e.clientX-start.current)*1.25};
 const up=()=>dragging.current=false;
 return <section className="browse-scene">
  <header className="desk-heading"><span>Correspondence</span><h1>Choose a letter to inspect</h1><p>Drag across the desk · Select an envelope to bring it closer</p></header>
  <div ref={rail} className="letter-rail" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
   {letters.map((l,i)=><div className="envelope-slot" key={l.id}><Envelope letter={l} index={i} selected={selected===i} read={read.has(l.id)} onSelect={setSelected}/><button className="envelope-label" onClick={()=>setSelected(i)}>{String(i+1).padStart(2,'0')} — {l.name}</button></div>)}
  </div>
  <button className="brass-arrow left" onClick={()=>setSelected(Math.max(0,selected-1))}><ChevronLeft/></button><button className="brass-arrow right" onClick={()=>setSelected(Math.min(letters.length-1,selected+1))}><ChevronRight/></button>
  <button className="inspect-action" onClick={onChoose}>Inspect &amp; open</button>
 </section>;
}