export default function PaperButton({children, onClick, subtle=false, className='', disabled=false}) {
  return <button onClick={onClick} disabled={disabled} className={`paper-button ${subtle?'paper-button-subtle':''} ${className}`}>{children}</button>;
}
