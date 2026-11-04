import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function ReadingMode({letter,onClose}) {
 return <motion.section className="reading-stage" initial={{opacity:0,scale:.92,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:20}} transition={{duration:.8,ease:[.16,.8,.2,1]}}>
  <button className="close-control" onClick={onClose} aria-label="Return to letters"><X/><span>Return to Letters</span></button>
  <article className="letter-sheet" style={{'--ink':letter.readingInk||letter.ink}}>
   <div className="letter-scroll"><header><span>{letter.mark}</span><small>PRIVATE CORRESPONDENCE · {letter.name.toUpperCase()}</small></header>
    {letter.salutation?<h1 dir="auto">{letter.salutation}</h1>:null}{letter.body.map((p,i)=><p key={i} dir="auto" className="whitespace-pre-wrap">{p}</p>)}
    {letter.closing||letter.sign?<footer>{letter.closing?<>{letter.closing}<br/>{letter.sign}</>:<>— {letter.sign}</>}</footer>:null}<div className="paper-insignia">{letter.mark}</div>
   </div>
  </article>
  <div className="reading-envelope" style={{'--paper':letter.tone}}/>
 </motion.section>;
}
