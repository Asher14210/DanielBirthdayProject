import { motion } from 'framer-motion';
import Envelope from './Envelope';
import PaperButton from './PaperButton';

export default function Arrival({letters,onContinue}) {
 return <section className="arrival" aria-label="New letters">
  <div className="arrival-stack">{letters.slice(0,6).map((l,i)=><motion.div key={l.id} className="stack-letter" initial={{y:-500,x:(i-2)*90,rotate:(i-3)*15,opacity:0}} animate={{y:i*3,x:(i-2)*7,rotate:(i-2.5)*4,opacity:1}} transition={{delay:.35+i*.18,duration:.8,ease:[.16,.8,.24,1]}}><Envelope letter={l} index={i}/></motion.div>)}</div>
  <motion.div className="arrival-copy" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:1.65,duration:.7}}>
   <span className="ornament">✦</span><h1>You got new letters!</h1><p>You can only open <strong>one</strong> letter.<br/>Carefully choose.</p>
   <PaperButton onClick={onContinue}>View Letters</PaperButton>
  </motion.div>
 </section>;
}