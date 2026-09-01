import { useEffect } from 'react';
import { motion,useReducedMotion } from 'framer-motion';

// Cinematic, weight-controlled opening. Depth layers are explicit:
//   desk ← back ← letter ← front-pocket ← flap ← wax
// The letter emerges from BEHIND the front pocket (never through it),
// then is nudged forward and grown toward the reader.
export default function OpeningSequence({letter,onComplete}) {
  const reduced=useReducedMotion();
  const D=reduced?.5:3.9;                                  // total, seconds
  useEffect(()=>{const t=setTimeout(onComplete,D*1000);return()=>clearTimeout(t)},[D,onComplete]);
  const ez=[.22,.66,.2,1];                                  // controlled, gentle settle
  const paper=letter.tone, paper2=shade(paper,-14), ink=letter.ink, wax=letter.seal;
  return <motion.section className="opening-stage"
    initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.4}}>
    {/* Stage settles toward the desk */}
    <motion.div className="opening-envelope"
      initial={{y:120,scale:.74,rotate:-7}} animate={{y:52,scale:1,rotate:-2}}
      transition={{duration:.5,ease:ez}}>
      {/* Back of envelope — lowest plane */}
      <div className="open-back" style={{'--p':paper,'--p2':paper2}}/>
      {/* Letter sits BEHIND the front pocket, emerges upward through the notch */}
      <motion.div className="emerging-letter"
        initial={{y:6}} animate={{y:[6,6,-12,-150,-178]}}
        transition={{duration:D*.5,delay:.62,times:[0,.18,.32,1],ease:ez}}>
        <header><span>{letter.mark}</span></header>
        <h2>{letter.salutation}</h2>
        <p>{letter.body[0]}</p>
      </motion.div>
      {/* Front pocket — the lip the letter slides behind */}
      <div className="open-front" style={{'--p':paper,'--p2':paper2}}/>
      {/* Flap opens upward */}
      <motion.div className="open-flap" style={{'--p':paper,'--p2':paper2}}
        initial={{rotateX:0}} animate={{rotateX:[0,0,-168,-175]}
}        transition={{duration:.46,delay:.52,times:[0,.08,.78,1],ease:[.34,0,.2,1]}}/>
      {/* Wax seal catches light, then breaks */}
      <motion.div className="open-seal" style={{'--wax':wax}}
        initial={{scale:1,rotate:0}} animate={{scale:[1,1.06,.2,0],rotate:[0,4,14,22],y:[0,0,40,90]}}
        transition={{duration:.42,delay:.74,times:[0,.4,.7,1],ease:ez}}>{letter.mark}</motion.div>
      {/* The letter is nudged forward + grown toward the reader at the end */}
      <motion.div className="letter-prompt" aria-hidden="true"
        initial={{opacity:0}} animate={{opacity:[0,0,.6]}} transition={{duration:.6,delay:1.9}}/>
    </motion.div>
    <motion.p className="opening-caption" initial={{opacity:0}} animate={{opacity:[0,0,.85,.4]}}
      transition={{duration:D,times:[0,.16,.4,1]}}>{letter.name}</motion.p>
  </motion.section>;
}

function shade(hex,pct){
  const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  const t=pct<0?0:255,p=Math.abs(pct)/100;
  r=Math.round((t-r)*p+r);g=Math.round((t-g)*p+g);b=Math.round((t-b)*p+b);
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}