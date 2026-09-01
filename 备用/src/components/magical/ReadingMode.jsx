import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function ReadingMode({letter,onClose}) {
 return <motion.section className="reading-stage" initial={{opacity:0,scale:.92,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:20}} transition={{duration:.8,ease:[.16,.8,.2,1]}}>
  <button className="close-control" onClick={onClose} aria-label="Return to letters"><X/><span>Return to Letters</span></button>
  <article className="letter-sheet" style={{'--ink':letter.ink}}>
   <div className="letter-scroll"><header><span>{letter.mark}</span><small>PRIVATE CORRESPONDENCE · {letter.name.toUpperCase()}</small></header>
    <h1>{letter.salutation}</h1>{letter.body.map((p,i)=><p key={i}>{p}</p>)}
    <p>Should this reach you intact, keep it somewhere dry, somewhere secret, and somewhere the clocks cannot hear.</p>
    <footer>— {letter.sign}</footer><div className="paper-insignia">{letter.mark}</div>
   </div>
  </article>
  <div className="reading-envelope" style={{'--paper':letter.tone}}/>
 </motion.section>;
}