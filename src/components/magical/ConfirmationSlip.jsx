import { motion } from 'framer-motion';
import PaperButton from './PaperButton';

export default function ConfirmationSlip({letter,onYes,onNo,first}) {
 return <motion.div className="confirm-wrap" initial={{opacity:0,scale:.9,y:30,rotate:-3}} animate={{opacity:1,scale:1,y:0,rotate:-1}} exit={{opacity:0,scale:.95}} transition={{duration:.38,ease:[.2,.8,.2,1]}}>
  <div className="confirmation-slip"><span>Selected correspondence</span><h2>Open this letter?</h2><p><em>{letter.name}</em><br/>{first?'You may choose only one.':'The seal will not mend itself.'}</p>
   <div><PaperButton onClick={onYes}>Yes, open it</PaperButton><PaperButton onClick={onNo} subtle>{first?'No no no':'Put it back'}</PaperButton></div>
  </div>
 </motion.div>;
}