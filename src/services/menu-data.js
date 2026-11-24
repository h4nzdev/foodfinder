const casaVerdeBranches = [
  ['way/1418856121', 'Casa Verde – Ramos'],
  ['node/5346397421', 'Casa Verde – The Terraces'],
]
const casaVerdeDishes = ['Brian’s Ribs', 'Seafood Carbonara', 'The Big Bang Burger']
const casaVerdeMenu = 'https://www.casaverdecebu.com/menu_main.html'
const abacaCentralBlocMenu = 'https://www.foodpanda.ph/restaurant/kqch/abaca-baking-company-ayala-central-bloc'
const checkedDate = '2026-11-25'

export const menuLinks = new Map([
  ...casaVerdeBranches.map(([id]) => [id, { url: casaVerdeMenu, source: 'Casa Verde official menu' }]),
  ['node/978232162', { url: 'https://bit.ly/CLCebuMenu', source: 'Laguna Group Cebu menu' }],
  ['node/3553477506', { url: 'https://bit.ly/CLCebuMenu', source: 'Laguna Group Cebu menu' }],
  ['node/13240137888', { url: abacaCentralBlocMenu, source: 'Foodpanda delivery menu' }],
  ['way/1267684281', { url: 'https://www.foodpanda.ph/restaurant/i6xf/abaca-baking-company-paseo-arcenas', source: 'Foodpanda delivery menu' }],
].map(([id, menu]) => [id, { ...menu, checkedDate }]))

export const verifiedEntries = [
  ...casaVerdeBranches.flatMap(([restaurantId, restaurantName]) => casaVerdeDishes.map((name, index) => ({
    id: `${restaurantId}/casa-verde-${index + 1}`, restaurantId, restaurantName, name, category: 'meals',
    source: 'Casa Verde official menu', sourceUrl: casaVerdeMenu, updatedAt: checkedDate,
  }))),
  ...[
    ['spanish-latte', 'Spanish Latte', 'drinks', 255],
    ['plain-bagel', 'Plain Bagel', 'meals', 95],
    ['brownie', 'Brownie', 'desserts', 170],
  ].map(([id, name, category, price]) => ({
    id: `abaca-central-bloc/${id}`, restaurantId: 'node/13240137888',
    restaurantName: 'Abaca Baking Company – Ayala Central Bloc', name, category, price, currency: 'PHP',
    source: 'Foodpanda delivery menu', sourceUrl: abacaCentralBlocMenu, updatedAt: checkedDate,
  })),
]

const samples = [
  ['1', 'demo/1', 'Sample Kitchen', 'Chicken Rice Bowl', 'Garlic rice and roasted chicken.', 'meals', 125],
  ['2', 'demo/2', 'Sample Café', 'Chicken Rice Bowl', 'Chicken and vegetables over rice.', 'meals', 155],
  ['3', 'demo/1', 'Sample Kitchen', 'Iced Coffee', 'Cold coffee served over ice.', 'drinks', 80],
  ['4', 'demo/2', 'Sample Café', 'Iced Coffee', 'House iced coffee.', 'drinks', 95],
  ['5', 'demo/2', 'Sample Café', 'Cassava Cake', 'A slice of baked cassava cake.', 'desserts', 70],
]

export const demoEntries = samples.map(([id, restaurantId, restaurantName, name, description, category, price]) => ({
  id, restaurantId, restaurantName, name, description, category, price,
  currency: 'PHP', source: 'FoodFinder demo data',
}))
