import { useState } from 'react';
import { motion } from 'framer-motion';
import PaperButton from './PaperButton';

export default function NameEntry({onContinue}) {
  const [name,setName]=useState('');
  const submit=()=>{ if(name.trim()) onContinue(name.trim()); };
  return <motion.section className="name-scene" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.6}}>
    <motion.div className="name-slip" initial={{y:-40,rotate:-2,opacity:0}} animate={{y:0,rotate:-1,opacity:1}} transition={{duration:.8,ease:[.16,.8,.2,1]}}>
      <span className="name-ornament">✦</span>
      <h1>To whom shall we<br/>address the post?</h1>
      <p>Inscribe your name below. The carriers ask it of every correspondent.</p>
      <input className="name-input" value={name} onChange={e=>setName(e.target.value)}
        onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Your name" maxLength={32} aria-label="Your name"/>
      <PaperButton onClick={submit}>Seal &amp; begin</PaperButton>
      <small className="name-hint">Keep your privacy — a chosen name will do.</small>
    </motion.div>
  </motion.section>;
}