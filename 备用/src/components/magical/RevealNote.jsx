import { motion } from 'framer-motion';
import PaperButton from './PaperButton';

export default function RevealNote({onContinue}) {
 return <section className="reveal-stage"><motion.div className="reveal-note" initial={{y:-600,rotate:-18,opacity:0}} animate={{y:0,rotate:2,opacity:1}} transition={{duration:.9,ease:[.15,.75,.25,1]}}>
  <span>✦</span><h1>Kidding.</h1><p>You can browse the rest<br/>whenever you want :)</p><PaperButton onClick={onContinue}>Continue browsing</PaperButton>
 </motion.div></section>;
}