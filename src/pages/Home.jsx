import { useEffect,useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import DeskScene from '@/components/magical/DeskScene';
import Arrival from '@/components/magical/Arrival';
import LetterCarousel from '@/components/magical/LetterCarousel';
import ConfirmationSlip from '@/components/magical/ConfirmationSlip';
import OpeningSequence from '@/components/magical/OpeningSequence';
import ReadingMode from '@/components/magical/ReadingMode';
import RevealNote from '@/components/magical/RevealNote';
import NameEntry from '@/components/magical/NameEntry';
import { letters } from '@/components/magical/letterData';

export default function Home(){
 const [scene,setScene]=useState('name'),[selected,setSelected]=useState(0),[read,setRead]=useState(new Set()),[firstDone,setFirstDone]=useState(false),[name,setName]=useState('');
 const letter=letters[selected];
 useEffect(()=>{const esc=e=>e.key==='Escape'&&scene==='reading'&&closeLetter();window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc)},[scene,firstDone]);
 const closeLetter=()=>{setRead(s=>new Set(s).add(letter.id));firstDone?setScene('browse'):setScene('reveal')};
 const choose=()=>setScene('confirm');
 return <DeskScene close={scene==='opening'||scene==='reading'}><AnimatePresence mode="wait">
  {scene==='name'&&<NameEntry key="name" onContinue={n=>{setName(n);setScene('arrival')}}/>} 
  {scene==='arrival'&&<Arrival key="arrival" letters={letters} onContinue={()=>setScene('browse')}/>} 
  {scene==='browse'&&<LetterCarousel key="browse" letters={letters} selected={selected} setSelected={setSelected} read={read} onChoose={choose}/>} 
  {scene==='confirm'&&<><LetterCarousel key="under" letters={letters} selected={selected} setSelected={setSelected} read={read} onChoose={choose}/><ConfirmationSlip key="confirm" letter={letter} first={!firstDone} onYes={()=>setScene('opening')} onNo={()=>setScene('browse')}/></>}
  {scene==='opening'&&<OpeningSequence key={letter.id+'open'} letter={letter} onComplete={()=>setScene('reading')}/>} 
  {scene==='reading'&&<ReadingMode key={letter.id+'read'} letter={letter} onClose={closeLetter}/>} 
  {scene==='reveal'&&<RevealNote key="reveal" onContinue={()=>{setFirstDone(true);setScene('browse')}}/>}
 </AnimatePresence></DeskScene>;
}