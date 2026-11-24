FOOD FINDER — Project Context & Development Guide
Project type: Web application / responsive web app (possible PWA)
Working name: FOOD FINDER
Main idea: Help people discover nearby places to eat and, most importantly, view a restaurant's menu and prices before deciding where to go.
Project status: Frontend prototype. The proposal below also records later phases.

## Run the frontend

Use Node.js 22.12 or newer.

### Set up Geoapify

1. Create a free account in [Geoapify MyProjects](https://myprojects.geoapify.com/). The Free plan requires no credit card.
2. Create a project, open **API keys**, and copy the project key. Under **Allowed origins**, add the local origin printed by Vite (usually `http://localhost:5173`) and your deployed website’s origin. Vite exposes `VITE_*` variables to the browser, so use a browser-restricted key and keep it out of source control. [Geoapify API key guide](https://myprojects.geoapify.com/help/api-keys/)
3. Copy `.env.example` to `.env.local` in the project root. Set `VITE_GEOAPIFY_API_KEY=your_key_here`, then restart Vite or rebuild the deployed frontend.

```sh
npm ci
npm run dev
npm run lint
npm run build
```

### Test discovery

Open Vite’s local URL. In a fresh tab, nearby discovery starts from **Cebu City, Philippines** at **3 km**. Search for **Cebu IT Park**, choose a matching location, then open **Explore** to see the map and cards update. Try Lahug, Apas, Cebu Business Park, Mandaue City, Talisay City, Naga City, Cebu, and Lapu-Lapu City. Switch among 1, 3, and 5 km, filter by cuisine, and select a restaurant on the map. Use **Use my current location** to try browser location access. Geolocation requires localhost or HTTPS and browser permission.

### Providers, limits, and troubleshooting

- Geoapify handles Places, forward geocoding, and reverse geocoding. The Free plan lists 3,000 credits per day and up to five requests per second. Places requests ask for up to 80 matches. If you see HTTP 401 or 403, verify the key and allowed origin. For HTTP 429, check your quota and retry after the provider cooldown. [Geoapify pricing](https://www.geoapify.com/pricing/)
- If Geoapify fails or the key is missing, restaurant discovery uses Overpass. Searches in and around the Philippines try the [regional Asia endpoint](https://ovp.dresel.systems/en/) first, followed by [Private.coffee](https://overpass.private.coffee/) and the [main Overpass API](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html). Other searches use the two global endpoints. Submitted location searches try [Nominatim](https://operations.osmfoundation.org/policies/nominatim/), spaced at least one second apart in the app. If reverse geocoding is unavailable, the app uses the GPS coordinates with the label **Current location**.
- Successful lookups are reused for 30 minutes in memory. When providers are unavailable, results up to 24 hours old can be shown with a cached-results label while the application is still open. The last manually selected location, radius, and cuisine selections are kept in tab storage for up to 30 minutes. GPS coordinates are used in memory and are never written to browser storage. If permission is denied, search for a neighborhood manually.
- If the map appears but restaurant results do not, try a different area or radius. A successful empty result means the provider returned no usable matches. If both providers fail and the app has no cached result, use **Retry** after checking your connection.

### Menu data

To try the menu and budget features, open **Find a Dish** or **Compare Prices**, enable **Explore sample menus**, and search for Chicken Rice Bowl with a maximum price of ₱150. Sample restaurants and prices are fictional and appear only when the demo option is enabled. Geoapify and Overpass supply place data. Verified dishes and prices come from the separate menu dataset.

For real menus, add permitted, verified entries to `src/services/menu-data.js`. Each record needs a unique `id`, a `restaurantId` matching the OpenStreetMap identifier such as `node/123`, `restaurantName`, `name`, and a `category` from `src/lib/categories.js`. Record the source and last-checked date in `source` and `updatedAt`. Include a numeric `price` and an ISO currency code such as `PHP` when the source lists a price. Optional fields include `sourceUrl`, `description`, `image`, and `availability`. The maximum-price filter applies to priced PHP entries. The starter data lists selected dishes from the official Casa Verde menu for two Cebu branches.

The `menuLinks` map in the same file matches each menu URL to a branch’s OpenStreetMap ID, with a source and checked date. Explore’s **Has menu** filter includes restaurants with a menu link or in-app dishes. The Abaca Baking Company Ayala Central Bloc entries use delivery prices from its Foodpanda listing.

1. Project Overview
FOOD FINDER is a location-based restaurant discovery application. It helps users find restaurants, cafés, food stalls, and other food places around them or around a searched location.

The core value is not simply showing restaurant pins on a map. The user should be able to:
1. Find food places nearby.
2. Search by restaurant name, food type, or location.
3. See useful details about a place.
4. Browse its menu and prices (where verified menu data is available).
5. Compare options based on distance, food type, and budget.
6. Decide where to eat without needing to open many separate pages.
Short concept statement
FOOD FINDER is a restaurant discovery and menu finder that helps users find nearby places to eat, explore available dishes and prices, and compare options based on location, cuisine, and budget.
2. Problem Statement
People often have difficulty choosing where to eat, especially in an unfamiliar area or when they have a specific budget or craving. They may need to search several apps or social-media pages to find restaurants, locate them, check what food they offer, and determine how much meals cost.

A map may show that a restaurant exists, but it may not provide a current menu or price list. Menu information can be scattered across posts, photos, delivery platforms, or a restaurant's own page.

FOOD FINDER aims to make restaurant discovery more convenient by bringing location information, restaurant details, menu information, and price comparisons into one interface.
Problems FOOD FINDER addresses
- Finding nearby restaurants is inconvenient or takes several searches.
- Users may not know what restaurants are in a particular area.
- Users want to see food choices before traveling to a restaurant.
- Menu prices can be difficult to find or may be posted in different places.
- Users need help choosing food that fits their budget.
- Users want to filter choices by food type, distance, and preferences.
- Users may need directions or a map location after choosing a place.
3. Target Users
- Students looking for affordable meals near campus.
- People looking for restaurants near their current location.
- Visitors exploring an unfamiliar neighborhood or city.
- Groups of friends choosing where to eat.
- People searching for a particular cuisine or dish.
- Budget-conscious users comparing menu prices.
- Users who prefer to preview a restaurant's menu before visiting.
4. Goals and Objectives
Main goal
Build an easy-to-use platform that helps users discover nearby food places and make informed dining choices through accessible restaurant, menu, and price information.
Specific objectives
- Show nearby food establishments based on the user's location or searched place.
- Allow users to search restaurants and food categories.
- Display restaurant details such as name, address, location, and available information.
- Provide a menu section with dish names, descriptions, pictures, and prices when available.
- Let users filter and compare options based on budget, category, and distance.
- Show restaurant locations on an interactive map.
- Provide directions or an external map link.
- Make the interface responsive for mobile phones, tablets, and desktops.
- Clearly identify information that is missing, estimated, or not recently verified.
5. Proposed Main Features
5.1 Location-based discovery
- Ask the user for permission to use their device location.
- Use coordinates to search for nearby food places.
- Allow users to manually search a location if they do not want to share their location.
- Provide a search radius or distance filter (for example, nearby, 1 km, 3 km, 5 km).
- Sort results by distance when coordinates are available.
5.2 Search
Search can support:
- Restaurant or business name.
- Food category (e.g., café, bakery, fast food, Filipino food).
- Cuisine (e.g., Japanese, Korean, Italian, Filipino).
- Dish or menu item (when the menu database has searchable items).
- Location or neighborhood.
Possible search placeholder:
“Search restaurants, food, dishes, or places…”

5.3 Category filters
Possible categories:
- Restaurants
- Cafés and coffee shops
- Fast food
- Filipino food
- Asian food
- Japanese
- Korean
- Chinese
- Italian
- Bakery and desserts
- Street food / food stalls
- Vegetarian-friendly (only where information is verified)
Categories should be editable/configurable rather than permanently hard-coded.
5.4 Restaurant results
Each result card may show:
- Restaurant name
- Restaurant image, if available
- Category/cuisine
- Address or area
- Distance from the selected location
- Opening status/hours, when data is available
- Menu availability indicator
- Price range, if the app has reliable data
- “View Details” button
- “View Menu” button
- “Show on Map” action
Do not invent ratings, opening hours, prices, or restaurant details. If data is missing, show “Not available” or omit that field.
5.5 Restaurant detail page
A restaurant page could include:
- Name and cover/photo gallery
- Cuisine/category
- Address
- Map preview and coordinates
- Opening hours (if available)
- Contact details or official link (if available)
- Short description
- Menu
- Menu price range
- Directions / map link
- Menu-data source and last-updated date
5.6 Menu and prices — the project's central feature
This is the key differentiator of FOOD FINDER.

Menu entries can include:
- Item name
- Photo (optional)
- Description (optional)
- Price in Philippine pesos (₱)
- Category (e.g., meals, snacks, drinks, desserts)
- Availability status (optional)
- Last verified date
- Source of information
Example display (sample data only):
Menu item	Description	Price
Chicken Meal	Sample description	₱99
Beef Meal	Sample description	₱129
Iced Coffee	Sample description	₱75


The sample items/prices above are placeholders and not real restaurant information.

Menu categories might be:
- Best sellers
- Meals
- Rice meals
- Snacks
- Drinks
- Desserts
- Specials
5.7 Budget filter
Allow users to set a budget range or select simple options such as:
- Budget-friendly
- Mid-range
- Higher price range
For a more useful version, let users filter menu items using a maximum price. Example: “Show meals ₱150 and below.” This should search actual menu records, not an assumed restaurant price range.
5.8 Food preference filters
Potential filters:
- Cuisine
- Dish type
- Vegetarian-friendly (only if the menu/business information supports it)
- Drinks or desserts
- Open now (only when reliable opening-hour data exists)
- Distance
- Budget
Avoid promising allergy-safe or dietary suitability unless the restaurant's information is verified and the app clearly communicates that users should confirm with the restaurant.
5.9 Map view
- Interactive map with restaurant markers.
- Marker click opens a small summary.
- Search results and map markers stay synchronized.
- “My location” control, if permission is granted.
- User can pan/zoom.
- Map attribution is displayed.
- Map can be toggled with a list view.
5.10 Directions
A “Get Directions” action can open an external map/navigation app or website using the destination coordinates/address. FOOD FINDER does not need to build its own navigation system for the first version.
5.11 Date and time
The app can display the current date/time, but this is not a core restaurant-discovery feature. Opening status should be calculated from available opening-hours data and local time. If hours are missing, do not guess whether a place is open.
5.12 Favorites (optional)
Users could save restaurants to a favorites list. This feature may require accounts or local browser storage.
5.13 Accounts (optional / later version)
Potential account features:
- Register / log in
- Saved restaurants
- Favorite menu items
- Preferences
Accounts are not necessary for the first prototype. A no-account experience is easier to build and test.
6. Important Data Sources and APIs
FOOD FINDER may use different data sources for different types of information. A location API does not automatically provide restaurant menus or current prices.
6.1 OpenStreetMap (OSM)
Purpose: Map data and geographic information, including mapped places such as restaurants and cafés.

Potential data:
- Place name
- Coordinates
- Some address details
- Category/tags
- Some opening-hours data, if contributors added it
OSM information may be incomplete or outdated. Display attribution such as © OpenStreetMap contributors and follow the applicable service/data policies.

Reference: https://www.openstreetmap.org/
6.2 Overpass API
Purpose: Query OpenStreetMap data for mapped establishments matching selected categories and a geographic area.

Use it for read-only discovery queries such as nearby restaurants, cafés, or other food-related points of interest. It is not a restaurant menu API.

Reference: https://wiki.openstreetmap.org/wiki/Overpass_API
6.3 Leaflet
Purpose: Render the interactive map in the web app and display markers.

Leaflet is a JavaScript mapping library. It works with a tile provider; the map library itself does not supply the restaurant database.

Reference: https://leafletjs.com/
6.4 Nominatim
Purpose: Convert a searched place/address into coordinates (geocoding), and optionally coordinates into a readable place/address (reverse geocoding).

Use it for a location search such as a neighborhood, city, or landmark. Respect the public service usage policy; it is not intended for unrestricted autocomplete or high-volume requests.

Reference: https://nominatim.org/
6.5 Menu database / menu source
Purpose: Store the restaurant menus and prices FOOD FINDER wants to display.

Possible data sources for menus:
- Manually encoded sample data for the prototype.
- Restaurant-provided menus, with permission/appropriate sourcing.
- Official restaurant websites or publicly provided menu information, where use is permitted.
- A future menu-data provider/API, after verifying availability, coverage, licensing, pricing, and terms.
Recommended first prototype: create your own database of selected restaurants and their menus. Start with a small set of restaurants in the project's test area, and clearly label menu information with its source and last verification date.

Do not assume that a third-party restaurant listing API will include a complete, current menu and item prices.
7. Recommended Technology Stack
Beginner-friendly prototype
- HTML — page structure
- CSS — styling and responsive layout
- JavaScript — search, filters, map interaction, rendering results
- Leaflet — interactive map
- OpenStreetMap — map tiles and geographic data
- Overpass API — nearby mapped food-place queries
- Nominatim — place/address search and geocoding
- Local JSON data — prototype restaurant/menu dataset
Full-stack version (later)
- Frontend: HTML, CSS, JavaScript (or a framework if the team later chooses one)
- Backend: PHP REST API
- Database: MySQL
- Database tool: phpMyAdmin (for local development)
- Local environment: XAMPP
- Code editor: VS Code
- Version control: Git and GitHub
- Deployment: a web hosting platform that supports the chosen backend/database; static hosting alone cannot run PHP/MySQL backend logic.
Suggested approach
Build and test the interface using sample JSON data first. Add live map/place discovery. Then create the backend and database for menu information, favorites, and any user accounts. This avoids trying to solve all integrations at once.
8. Proposed Application Pages
Page 1 — Home / Discover
- FOOD FINDER logo and navigation
- Location search
- Main search bar
- Category chips
- Nearby restaurant results
- Map/list toggle
- Budget or distance quick filters
Page 2 — Search Results
- Search query
- Filters
- Results list
- Distance and category
- Map markers
- Sort controls
Page 3 — Restaurant Details
- Restaurant name and photo
- Address and map
- Basic information
- Opening hours (when available)
- Menu categories and menu items
- Price
- Last-updated label
- Directions button
Page 4 — Favorites (optional)
- Saved restaurants
- Remove from favorites
- Open restaurant details
Page 5 — About / Project Information
- Purpose of FOOD FINDER
- How location and menu information are sourced
- Contact / feedback (if appropriate)
9. Suggested UI/UX Design
Design principles
- Simple and clean.
- Search should be prominent.
- Menu prices should be easy to scan.
- Restaurant cards should not be cluttered.
- Mobile-first layout.
- Clear labels for missing information.
- Use a consistent spacing, typography, and icon system.
Possible visual direction
- Food-inspired colors: warm orange, yellow, cream, dark brown, or green.
- Light background with high-contrast text.
- Rounded restaurant cards.
- Clear category icons.
- A map/list toggle.
- Menu cards with dish image, name, and price.
Example home layout
1. Header/logo
2. “Find something good to eat nearby”
3. Location selector
4. Search field
5. Food category chips
6. Budget and distance filters
7. Nearby places list
8. Map preview
10. Data Model (Proposed)
Restaurant
Field	Purpose
restaurant_id	Unique ID
name	Restaurant name
description	Short description
category	Main category
cuisine	Cuisine type
address	Address/location text
latitude	Map coordinate
longitude	Map coordinate
phone	Optional contact
website	Optional official link
opening_hours	Optional schedule
image_url	Optional photo
source	Source of information
last_verified_at	Last verification date


Menu Category
Field	Purpose
category_id	Unique ID
restaurant_id	Restaurant this category belongs to
category_name	e.g., Meals, Drinks, Desserts


Menu Item
Field	Purpose
menu_item_id	Unique ID
restaurant_id	Restaurant ID
category_id	Optional menu category
name	Dish/drink name
description	Optional description
price	Numeric price
image_url	Optional photo
availability	Optional status
source	Source of menu data
last_verified_at	Last verification date


User (optional)
Field	Purpose
user_id	Unique ID
name	User display name
email	Login email
password_hash	Secure password hash, never plain text
created_at	Account creation date


Favorites (optional)
Field	Purpose
favorite_id	Unique record
user_id	User who saved it
restaurant_id	Saved restaurant


11. Suggested MySQL Tables
Possible table names:
- restaurants
- menu_categories
- menu_items
- users (optional)
- favorites (optional)
Relationship:
- One restaurant → many menu categories.
- One restaurant → many menu items.
- One menu category → many menu items.
- One user → many favorite restaurants.
- One restaurant → many users may favorite it.
Menu prices should use a decimal data type (e.g., DECIMAL(10,2)), not floating-point, for accurate currency storage.
12. Possible API / Backend Endpoints
These are proposed routes for a PHP backend:
Restaurant endpoints
- GET /api/restaurants — list restaurants
- GET /api/restaurants/{id} — restaurant details
- GET /api/restaurants?search=... — search by name
- GET /api/restaurants?category=... — filter by category
- GET /api/restaurants?lat=...&lng=...&radius=... — nearby results (if implemented server-side)
Menu endpoints
- GET /api/restaurants/{id}/menu — restaurant menu
- GET /api/menu-items?search=... — search dishes
- GET /api/menu-items?max_price=... — budget filter
- GET /api/menu-items/{id} — one menu item
Optional account/favorites endpoints
- POST /api/register
- POST /api/login
- GET /api/favorites
- POST /api/favorites
- DELETE /api/favorites/{id}
API responses should use JSON and return clear error messages and status codes. Backend inputs must be validated; database queries should use prepared statements.
13. Main User Flow
Flow A — Find food near me
1. User opens FOOD FINDER.
2. User chooses to allow location access.
3. App gets coordinates (or user enters a location manually).
4. App searches nearby food places.
5. User sees a list and map markers.
6. User filters by food type, distance, or budget.
7. User opens a restaurant.
8. User reviews the menu and prices.
9. User chooses “Directions” or opens the location in a map app.
Flow B — Find a specific food
1. User searches a food type or dish.
2. App filters matching restaurants/menu items.
3. Results show the restaurant, distance, and matching item (when menu data exists).
4. User checks price and restaurant details.
5. User selects a restaurant.
Flow C — Find food within a budget
1. User sets a maximum menu price or budget range.
2. App searches available menu records.
3. Results show menu items and their restaurants.
4. User compares choices.
5. User opens the restaurant details.
Flow D — Search another location
1. User enters a place or address.
2. App geocodes the search.
3. App searches food establishments near the searched coordinates.
4. User explores results without sharing current-device location.
14. Search and Filtering Logic
Potential filter fields:
- Search term
- Category
- Cuisine
- Current/search location
- Radius
- Maximum menu price
- Menu category
- Open-now (only if hours are known and reliable)
Possible sort options:
- Nearest
- Name (A–Z)
- Lowest menu price (only if comparable price data exists)
When a search is made, the app should:
1. Normalize the search text.
2. Apply the selected category and price filters.
3. Calculate distance if coordinates exist.
4. Sort the result.
5. Render matching cards and markers.
6. Show a friendly empty state if nothing matches.
15. Distance Calculation
When restaurant and user/search coordinates are available, calculate approximate straight-line distance using a geographic distance formula such as the Haversine formula.

Distance is useful for sorting and filtering, but it is not the same as walking or driving distance. Label it accordingly (e.g., “about 800 m away”). For actual routes, use a routing service or open an external map application.
16. Data Accuracy and Trust
Restaurant locations and menus may change. FOOD FINDER should:
- Keep the data source.
- Track the last verified date for menu prices.
- Label user-submitted or unverified information.
- Avoid showing fake ratings or fake opening statuses.
- Provide a way to report incorrect information (future feature).
- Avoid claiming that every restaurant has a full menu.
- Clearly state when menu information is unavailable.
- Consider restaurant permission and source terms before collecting or displaying menu photos/content.
Possible status labels:
- Verified recently
- Last updated: [date]
- Menu information unavailable
- Prices may have changed — please confirm with the restaurant
17. Privacy and Permissions
- Ask for location permission only when it is needed.
- Explain why location is being requested.
- Provide manual location search as an alternative.
- Do not store precise location history by default.
- Do not expose account credentials or personal information.
- If accounts are implemented, use secure password hashing and HTTPS.
- Keep API keys/secrets out of public frontend code when a service requires secret credentials.
18. Limitations / Risks
- OpenStreetMap restaurant coverage varies by area.
- Place data may not contain menu, photos, phone numbers, or opening hours.
- Public APIs may have rate limits and usage policies.
- Menu data is the hardest part to keep current.
- Geolocation requires permission and may be unavailable.
- Some restaurants may not have reliable coordinates.
- Menu prices and availability can change.
- A static frontend cannot securely handle account authentication or private database access.
- Hosting and database availability may affect the deployed app.
19. MVP (Minimum Viable Product)
To avoid making the first version too complicated, the MVP should contain:
1. Home page with search.
2. Manual location search and optional device location.
3. Nearby restaurant discovery from a place-data source.
4. Restaurant list and interactive map.
5. Restaurant detail page.
6. Menu and price display using a small, curated dataset.
7. Basic food category filter.
8. Basic budget/maximum-price filter for menu items.
9. Directions link.
10. Responsive design.
Do not begin with every advanced feature. First make this core experience work from end to end.
Later features
- User accounts
- Favorites
- Reviews/ratings (with moderation and clear sourcing)
- User-submitted menu updates
- Restaurant owner portal
- Menu photos
- Advanced dietary filters
- Personalized recommendations
- Route/distance options
- Notifications
- Admin dashboard for managing restaurant/menu records
20. Recommended Development Roadmap
Phase 1 — Plan and design
- Finalize requirements.
- Sketch wireframes.
- Decide the first test area.
- Decide how many sample restaurants will be included.
- Create the menu data format.
Phase 2 — Frontend prototype
- Create project folder.
- Create index.html, style.css, and script.js.
- Build navigation, search, category chips, cards, and responsive layout.
- Populate the interface with sample data.
Phase 3 — Map integration
- Add Leaflet map.
- Add OpenStreetMap tiles with attribution.
- Add markers.
- Connect list cards to map markers.
- Test location permission and manual location search.
Phase 4 — Place discovery
- Integrate a place query/geocoding service.
- Search restaurants/cafés around a chosen coordinate.
- Handle loading, empty results, and errors.
- Respect service usage policies and avoid excessive requests.
Phase 5 — Menu database
- Set up XAMPP and MySQL.
- Create restaurant/menu tables.
- Add a small test dataset.
- Build PHP JSON endpoints.
- Fetch menu records from the frontend.
Phase 6 — Filters and details
- Implement category, distance, and budget filters.
- Build restaurant detail view.
- Build menu display.
- Add directions links.
Phase 7 — Testing
- Test desktop and mobile sizes.
- Test denied location permission.
- Test manual location search.
- Test missing menu and missing prices.
- Test API failure/slow loading.
- Test incorrect search and no-results state.
- Check that prices and restaurant details are not fabricated.
Phase 8 — Deployment
- Choose hosting that supports the actual frontend/backend requirements.
- Configure database and environment settings.
- Keep secrets private.
- Test deployed URLs and mobile usability.
- Add data-source attribution and project information.
21. Suggested Project Folder Structure
Simple frontend prototype
food-finder/
├── index.html
├── style.css
├── script.js
├── data/
│   ├── restaurants.json
│   └── menus.json
├── assets/
│   ├── images/
│   └── icons/
└── README.md
PHP + MySQL version
food-finder/
├── public/
│   ├── index.html
│   ├── assets/
│   │   ├── css/style.css
│   │   ├── js/app.js
│   │   └── images/
│   └── pages/
├── api/
│   ├── restaurants.php
│   ├── restaurant-details.php
│   ├── menu.php
│   └── search.php
├── config/
│   └── database.php
├── database/
│   └── food_finder.sql
└── README.md
The public web root should not expose configuration files or secrets.
22. Suggested Sample JSON Format
{
  "restaurants": [
    {
      "id": 1,
      "name": "Sample Restaurant",
      "category": "Restaurant",
      "cuisine": "Filipino",
      "address": "Sample address",
      "latitude": 10.0000,
      "longitude": 123.0000,
      "openingHours": null,
      "menuLastVerified": "2026-11-01",
      "menu": [
        {
          "id": 101,
          "name": "Sample Rice Meal",
          "description": "Sample menu description",
          "category": "Meals",
          "price": 99.00,
          "image": null
        }
      ]
    }
  ]
}
All sample entries are placeholders. Replace them with data that the team has verified and is allowed to use.
23. Definition of Done for the MVP
The first version is ready for demonstration when:
- [ ] User can open the app.
- [ ] User can search a location manually.
- [ ] User can optionally use device location.
- [ ] App can show nearby food places from its selected data source.
- [ ] Results appear as cards.
- [ ] Results appear on a map.
- [ ] User can open restaurant details.
- [ ] Menu items and prices can be displayed from the project's own dataset/database.
- [ ] User can filter menu items by a maximum price.
- [ ] User can filter restaurants by a basic category.
- [ ] Directions action works.
- [ ] App works at mobile and desktop widths.
- [ ] App handles loading, empty, and error states.
- [ ] Missing information is shown honestly.
- [ ] Map/data attribution is visible.
24. What FOOD FINDER Is / Is Not
FOOD FINDER IS
- A restaurant and food-place discovery tool.
- Location-based.
- A menu and price finder.
- A food/category search tool.
- A way to compare available choices.
- A map/list interface.
FOOD FINDER IS NOT (for the first version)
- A food delivery service.
- A payment application.
- A restaurant reservation platform.
- A live inventory system.
- A guaranteed source of every restaurant's latest menu.
- A turn-by-turn navigation app.
- A social review platform (unless added later).
25. Project Summary for AI Coding Tools
Use this as the context prompt when asking an AI coding assistant to help with FOOD FINDER:
I am developing FOOD FINDER, a responsive web application for discovering nearby restaurants, cafés, and food places. The main purpose is to help users find restaurants around their current or searched location and, importantly, view restaurant menus and prices before choosing where to eat.

Core features: location search, optional browser geolocation, restaurant/food search, category filters, nearby restaurant list, interactive map with markers, restaurant detail pages, menu items with prices, budget/maximum-price filtering, distance information, and directions links.

Suggested prototype technologies: HTML, CSS, JavaScript, Leaflet, OpenStreetMap map tiles, Overpass for nearby mapped places, Nominatim for place search/geocoding, and sample JSON data for menus. A later full-stack version may use PHP REST endpoints and MySQL through XAMPP/phpMyAdmin.

Important: location APIs provide place/location data, not complete restaurant menus. Menu information should come from a separate curated dataset/database or a verified permitted provider. Do not invent restaurant details, menu items, prices, ratings, or opening hours. Mark sample data as sample data and track menu source/last verification date.

Build the project in small, testable steps. Keep HTML, CSS, and JavaScript separated. Make the UI responsive and beginner-friendly. Include loading, error, and no-results states. Provide clear instructions about which file to edit, what code to add, and how to run/test each step. Do not replace working project code without explaining the changes.

26. References
- OpenStreetMap: https://www.openstreetmap.org/
- OpenStreetMap API/data overview: https://wiki.openstreetmap.org/wiki/APIs
- Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- Leaflet documentation: https://leafletjs.com/
- Nominatim documentation: https://nominatim.org/
- OpenStreetMap map usage and policies: https://wiki.openstreetmap.org/wiki/Using_Openstreetmap
Remember to review current service policies, limits, and attribution requirements before deployment, especially if the application makes frequent or many-user requests.
