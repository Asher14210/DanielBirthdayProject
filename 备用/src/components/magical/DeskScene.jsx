import { motion, useReducedMotion } from 'framer-motion';

export default function DeskScene({ children, close=false }) {
  const reduced = useReducedMotion();
  const move = (e) => {
    if (reduced) return;
    const x=(e.clientX/innerWidth-.5), y=(e.clientY/innerHeight-.5);
    e.currentTarget.style.setProperty('--mx', `${x*9}px`);
    e.currentTarget.style.setProperty('--my', `${y*7}px`);
  };
  return <motion.main onMouseMove={move} className={`desk-scene ${close?'desk-close':''}`} initial={{opacity:0}} animate={{opacity:1}}>
    <div className="room-layer"/><div className="window-layer"><i/><i/><i/></div>
    <div className="rear-props"><div className="books"/><div className="inkwell"/><div className="lamp"/></div>
    <div className="table-layer"/><div className="table-scratches"/>
    <div className="foreground-props"><div className="quill"/><div className="wax-pieces"/></div>
    <div className="light-ray"/><div className="dust" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i}/>)}</div>
    <div className="scene-content">{children}</div><div className="vignette"/>
  </motion.main>;
}