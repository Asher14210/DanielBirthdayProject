import { motion } from 'framer-motion';

// Material-driven envelope. Layers stack to imply real paper thickness,
// tonal variation, an irregular wax seal, and reactive light — no flat fills.
export default function Envelope({letter,index,selected,read,onSelect,opening=false}) {
  const tilt=[-4,2,-2,4,-3,1,3,-1,2,-3][index%10];
  return <motion.button aria-label={`${letter.name}${read?', read':''}`} onClick={()=>onSelect?.(index)}
    className={`envelope ${selected?'is-selected':''} ${read?'is-read':''} ${opening?'is-opening':''}`}
    style={{'--paper':letter.tone,'--paper2':shade(letter.tone,-14),'--paper3':shade(letter.tone,10),'--ink':letter.ink,'--wax':letter.seal,'--wax2':shade(letter.seal,-22),'--wax3':shade(letter.seal,28),'--tilt':`${tilt}deg`}}
    initial={false} animate={{y:selected?-18:0,scale:selected?1.04:1,rotate:selected?0:tilt}}
    whileHover={!opening?{y:selected?-21:-7,rotate:tilt*.25}:undefined}
    transition={{duration:.4,ease:[.2,.75,.2,1]}}>
    {/* thickness / side wall implied under the flap */}
    <span className="env-thickness"><i/><i/><i/></span>
    <span className="envelope-back"><span className="paper-grain"/><span className="paper-fibers"/><span className="paper-edge-dark"/></span>
    <span className="envelope-flap"><span className="flap-shade"/></span>
    <span className="envelope-side left"/><span className="envelope-side right"/>
    <span className="envelope-address"><small>{letter.note}</small><b>{letter.name}</b><em>{letter.sender}</em></span>
    <span className="stamp">{String(index+1).padStart(2,'0')}<i>{letter.mark}</i></span>
    <span className="wax-seal" aria-hidden="true">
      <span className="wax-rim"/><span className="wax-face"><i>{letter.mark}</i></span>
      <span className="wax-glint"/><span className="wax-edge-light"/>
    </span>
    {read&&<span className="read-mark">read ✓</span>}
  </motion.button>;
}

// lighten (+) or darken (-) a hex by pct; keeps material logic parametric
function shade(hex,pct){
  const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  const t=pct<0?0:255,p=Math.abs(pct)/100;
  r=Math.round((t-r)*p+r);g=Math.round((t-g)*p+g);b=Math.round((t-b)*p+b);
  return `#${((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}`;
}