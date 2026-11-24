import { MapPin, WifiOff, Utensils, BookOpen, Search, Scale } from 'lucide-react'
import { Button } from './ui/button'

const icons = { map: MapPin, offline: WifiOff, restaurant: Utensils, menu: BookOpen, search: Search, comparison: Scale }

export function EmptyState({ type = 'map', title, description, action, onAction }) {
  const Icon = icons[type]
  return (
    <div className="empty-state">
      <div className="empty-art" aria-hidden="true">
        <svg viewBox="0 0 120 82">
          <ellipse cx="60" cy="71" rx="43" ry="8" fill="#f0e7f7"/>
          <path d="m10 27 18-8 23 8 21-8 21 9v38l-21-9-21 8-23-8-18 8z" fill="#f3ecf8" stroke="#e1d4ec" strokeWidth="1.5"/>
          <path d="M28 20v37m23-30v38m21-46v38M13 50l20-12 23 10 23-13 14 9" fill="none" stroke="#d8c5e8" strokeWidth="1.5" strokeDasharray="4 3"/>
          <circle cx="63" cy="36" r="24" fill="#e8d9f2"/>
          <path d="M99 15v12m-6-6h12M17 8v8m-4-4h8" stroke="#a076c3" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="105" cy="48" r="2.5" fill="#a076c3"/>
        </svg>
        <Icon size={25} strokeWidth={1.8}/>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <Button variant="outline" onClick={onAction}>{action}</Button>}
    </div>
  )
}

export function LoadingState({ label = 'Loading restaurants' }) {
  return <div className="skeletons" role="status">
    <p className="muted">{label}…</p>
    {[1, 2, 3].map((item) => <div key={item} className="skeleton"><i/><span><i/><i/></span></div>)}
  </div>
}
