import { MapPin, BookOpen, Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MenuSearch } from '../components/Menus'
import { Button } from '../components/ui/button'

export function MenuPage({ comparison = false }) {
  return <div className="page-shell inner-page menu-layout">
    <header className="page-heading">
      <span className="page-heading-icon" aria-hidden="true">{comparison ? <Scale size={28}/> : <BookOpen size={28}/>}</span>
      <h1>{comparison ? 'Compare prices' : 'Search for a dish'}</h1>
      <p>{comparison ? 'Look up a dish to compare verified menu prices across restaurants.' : 'Look up dishes by name or browse by food category.'}</p>
    </header>
    <MenuSearch comparison={comparison}/>
  </div>
}

const features = [
  { icon: MapPin, name: 'Find restaurants', text: 'Start with a neighborhood or your current location, then explore nearby places on an interactive map.', to: '/explore' },
  { icon: BookOpen, name: 'Browse dishes', text: 'Look for food by dish name or category as verified menus become available.', to: '/food-search' },
  { icon: Scale, name: 'Compare prices', text: 'See listed prices side by side when verified menu records are available.', to: '/compare' },
]

export function About() {
  return <div className="page-shell inner-page about-page">
    <header className="page-heading"><h1>About FoodFinder</h1><p>Discover nearby restaurants, browse menus, and compare listed prices.</p></header>
    <section className="surface mission"><h2>Our mission</h2><p>Make it easier to decide where and what to eat by bringing local restaurant discovery and verified menu information together.</p></section>
    <section className="about-features" aria-label="FoodFinder features">
      {features.map(({ icon: Icon, name, text, to }) => <article key={name} className="surface">
        <Icon size={25}/><h2>{name}</h2><p>{text}</p><Button asChild variant="outline"><Link to={to}>{name}</Link></Button>
      </article>)}
    </section>
    <section className="surface mission"><h2>Technology and data</h2>
      <p>Restaurant and location data come from Geoapify and OpenStreetMap services. Menu links are matched to individual branches. Dish search and price comparison use sourced menu records, which may include delivery prices.</p>
      <p><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · <a href="https://operations.osmfoundation.org/policies/nominatim/">Nominatim usage policy</a></p>
    </section>
  </div>
}
