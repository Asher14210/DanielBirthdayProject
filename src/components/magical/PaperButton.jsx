export default function PaperButton({children, onClick, subtle=false, className=''}) {
  return <button onClick={onClick} className={`paper-button ${subtle?'paper-button-subtle':''} ${className}`}>{children}</button>;
}