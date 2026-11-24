import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BookOpen, Compass, MapPin, Menu, Scale, Utensils, X } from 'lucide-react'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { DiscoveryProvider } from './context/DiscoveryProvider'
import { Home } from './pages/Home'
import { Explore } from './pages/Explore'
import { About, MenuPage } from './pages/InfoPages'
import { RestaurantDetails } from './components/Restaurants'
import { EmptyState } from './components/EmptyState'
import { Button } from './components/ui/button'

const links = [['/', 'Discover', Compass], ['/explore', 'Explore', MapPin], ['/food-search', 'Find a dish', BookOpen], ['/compare', 'Compare prices', Scale]]

function Brand() {
  return <Link className="brand" to="/" aria-label="FoodFinder home"><span><Utensils size={20}/></span>Food<span className="brand-accent">Finder</span></Link>
}

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <div className="page-shell navbar">
      <Brand/>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([to, name, Icon]) => <NavLink key={to} to={to} end={to === '/'}><Icon size={17}/>{name}</NavLink>)}
      </nav>
      <div className="nav-actions">
        <NavLink className="nav-about" to="/about">About</NavLink>
        <button type="button" className="icon-button mobile-menu-toggle" aria-expanded={open} aria-controls="mobile-menu"
          aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
    </div>
    <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation" hidden={!open} onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false) }}>
      {links.map(([to, name, Icon]) => <NavLink end={to === '/'} key={to} to={to} onClick={() => setOpen(false)}><Icon size={17}/>{name}</NavLink>)}
      <NavLink to="/about" onClick={() => setOpen(false)}>About</NavLink>
    </nav>
  </header>
}

function Footer() {
  return <footer className="site-footer"><div className="page-shell footer-content">
    <Brand/><div><Link to="/about">About</Link><a href="https://www.geoapify.com/">Powered by Geoapify</a><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>
      <a href="https://operations.osmfoundation.org/policies/nominatim/">Nominatim usage policy</a></div>
  </div></footer>
}

function Application() {
  const [details, setDetails] = useState(null)
  const detailsTrigger = useRef(null)
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  function showDetails(restaurant, section) {
    detailsTrigger.current = document.activeElement
    setDetails({ restaurant, section })
  }

  function closeDetails() {
    setDetails(null)
    requestAnimationFrame(() => detailsTrigger.current?.focus({ preventScroll: true }))
  }

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Header key={pathname}/>
    <main id="main">
      <Routes>
        <Route path="/" element={<Home onDetails={showDetails}/>}/>
        <Route path="/explore" element={<Explore onDetails={showDetails}/>}/>
        <Route path="/food-search" element={<MenuPage key="search"/>}/>
        <Route path="/compare" element={<MenuPage key="compare" comparison/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="*" element={<div className="page-shell inner-page"><EmptyState title="Page not found" description="The page you requested is unavailable."/><Button asChild><Link to="/">Back to home</Link></Button></div>}/>
      </Routes>
    </main>
    <Footer/>
    <RestaurantDetails restaurant={details?.restaurant} section={details?.section} onClose={closeDetails}/>
    <Toaster position="bottom-right" richColors closeButton/>
  </>
}

export default function App() {
  return <BrowserRouter><MotionConfig reducedMotion="user"><DiscoveryProvider><Application/></DiscoveryProvider></MotionConfig></BrowserRouter>
}
