# FOOD FINDER — Fix and Improve Restaurant API Integration

## Objective

Improve the existing FOOD FINDER application by fixing its restaurant discovery, location search, and geolocation functionality using reliable, free-tier APIs.

The current OpenStreetMap, Overpass API, and Nominatim integration is not consistently loading restaurant or location data.

Implement Geoapify as the primary location and restaurant discovery provider while retaining free fallback services.

## 1. Inspect the Existing Application

Before implementing changes:

- Analyze the existing project structure.
- Identify the current restaurant discovery and location services.
- Identify why restaurant data and location searches are not loading.
- Review the existing search, filters, map markers, and restaurant detail functionality.
- Reuse existing components and services wherever possible.

Do not rebuild the application from scratch.

## 2. API Integration

Implement the following services:

### Primary APIs

- Geoapify Places API — nearby restaurant and food establishment discovery.
- Geoapify Geocoding API — manual location and address search.
- Geoapify Reverse Geocoding API — convert coordinates into readable location names.

### Fallback APIs

- Private.coffee Overpass API — backup restaurant discovery.
- Nominatim — backup manual location search, following its usage policy.
- Cached successful results — fallback when external APIs are unavailable.

### Retain Existing Technologies

- Vite
- Existing frontend framework and styling
- Leaflet
- OpenStreetMap map tiles
- Browser Geolocation API
- Existing menu dataset and budget filtering

Do not introduce paid APIs or services requiring payment information.

## 3. Environment Configuration

Create or update the following files:

- `.env.example`
- `.gitignore`
- `README.md`

Use the following environment variable:

```env
VITE_GEOAPIFY_API_KEY=
```

Read the API key using `import.meta.env.VITE_GEOAPIFY_API_KEY`.

If the API key is missing, display a clear configuration message and use supported fallback services where possible.

Never hard-code the API key into source files. Explain that Vite environment variables are publicly visible in the browser and that the key should be restricted to approved website origins.

## 4. Restaurant Discovery

Implement Geoapify Places API:

```text
https://api.geoapify.com/v2/places
```

Requirements:

- Fetch real nearby food establishments.
- Support restaurants, cafés, fast food, bakeries, and other supported food categories.
- Use the selected latitude and longitude.
- Support configurable search radiuses of 1 km, 3 km, and 5 km.
- Use a default radius of 3 km.
- Sort results by approximate distance.
- Request a reasonable number of results to conserve free API credits.
- Display restaurant names, addresses, coordinates, categories, and other available information.
- Do not generate fake ratings, images, opening hours, menu items, or prices.

Use `catering` and other appropriate documented Geoapify categories.

Normalize Geoapify responses into the application's existing restaurant data structure.

Preserve OpenStreetMap identifiers where available to maintain compatibility with the existing menu dataset.

Ensure that latitude and longitude are not accidentally reversed.

## 5. Location Search

Implement Geoapify Geocoding API:

```text
https://api.geoapify.com/v1/geocode/search
```

Requirements:

- Support manual location search.
- Prioritize Philippine locations.
- Support locations throughout Cebu.
- Display multiple matching locations when appropriate.
- Update the selected coordinates after the user chooses a location.
- Recenter the Leaflet map.
- Fetch restaurants around the newly selected location.

Test using:

- Cebu City
- Lahug
- Apas
- Cebu IT Park
- Cebu Business Park
- Mandaue City
- Talisay City
- Naga City, Cebu
- Lapu-Lapu City

Use debouncing for supported search providers to prevent excessive requests. Do not use the public Nominatim service for autocomplete.

## 6. Current Location

Implement or repair browser geolocation.

Requirements:

- Add or retain a functional Use My Location button.
- Request location permission only when needed.
- Retrieve the user's latitude and longitude.
- Use reverse geocoding to display a readable location name.
- Recenter the map to the user's coordinates.
- Fetch nearby food establishments.
- Handle denied permissions, unavailable location, and request timeouts.
- Allow manual location search when geolocation fails.

If no location has been selected, use Cebu City as the clearly labeled default location:

```javascript
const DEFAULT_LOCATION = {
  name: "Cebu City, Philippines",
  latitude: 10.3157,
  longitude: 123.8854
};
```

Do not represent the default location as the user's actual GPS location.

## 7. Automatic API Fallback

Implement the following restaurant discovery flow:

```text
Restaurant Search
    |
    v
Geoapify Places API
    |
    +-- Success --> Display restaurant results
    |
    +-- Failure --> Private.coffee Overpass API
                        |
                        +-- Success --> Display results
                        |
                        +-- Failure --> Cached results
                                            |
                                            +-- No cache --> Error state
```

Overpass fallback endpoint:

```text
https://overpass.private.coffee/api/interpreter
```

Nominatim location search fallback:

```text
https://nominatim.openstreetmap.org/search
```

Requirements:

- Handle network failures.
- Handle HTTP 429 rate-limit errors.
- Handle invalid or missing API keys.
- Handle server errors and request timeouts.
- Use bounded retries and request cancellation.
- Avoid infinite retry loops.
- Do not treat a valid empty response as an API failure.
- Do not repeatedly call unavailable services.
- Respect the usage policies of all public services.

If all providers fail, display cached results when available. Otherwise, show a friendly error message and Retry button.

Never display fictional restaurants as real fallback data.

## 8. Local Caching

Implement lightweight caching using LocalStorage or the application's existing caching mechanism.

Cache:

- Successful restaurant discovery results.
- Search coordinates and radius.
- Selected food categories.
- Previously selected locations.
- Cache creation timestamp.

Use a configurable cache expiration, initially 30 minutes.

Prevent duplicate API requests for the same search parameters.

Clearly label cached results when they are displayed because the live API is unavailable.

Do not store precise user location history unnecessarily.

## 9. Map Integration

Retain Leaflet and OpenStreetMap.

Ensure that:

- Restaurant markers appear after successful API requests.
- Restaurant cards and map markers remain synchronized.
- Selecting a restaurant highlights its corresponding marker.
- Selecting a marker displays the correct restaurant information.
- Changing the selected location updates the map.
- Old markers are removed when new search results arrive.
- The map remains responsive on desktop and mobile.
- Required data-source and map attribution remains visible.

## 10. Menu and Budget Features

Preserve the existing menu and price comparison functionality.

Geoapify and Overpass provide restaurant location information, not complete menus or individual meal prices.

Therefore:

- Retain `src/services/menu-data.js` or its existing equivalent.
- Preserve restaurant-to-menu matching using stable identifiers.
- Display verified menu information only when available.
- Preserve dish search and maximum-price filtering.
- Do not assign fictional menus to real restaurants.
- Keep sample menus clearly separated from real restaurant results.
- Display "Menu information unavailable" when no verified menu exists.

Do not introduce AI-generated menu prices.

## 11. Loading, Empty, and Error States

Ensure the application displays appropriate feedback:

- Loading nearby restaurants...
- Searching location...
- No restaurants found in this area.
- Location permission denied.
- Showing previously cached results.
- Unable to connect to restaurant services.
- Menu information unavailable.

Prevent indefinite loading indicators.

Preserve the existing visual design and enhance only the functionality necessary for this integration.

## 12. Suggested Service Organization

Adapt this structure to the existing codebase instead of unnecessarily restructuring the project:

```text
src/
  services/
    geoapify.js
    overpass.js
    geocoding.js
    restaurant-service.js
    cache.js
    menu-data.js
```

Keep API requests, data normalization, caching, and UI logic appropriately separated.

Avoid unnecessary dependencies, complicated architecture, and duplicate services.

## 13. Testing and Validation

Test the following scenarios:

- Restaurant discovery using Cebu City coordinates.
- Manual location search for Cebu IT Park.
- Current-location permission granted.
- Current-location permission denied.
- Changing search radius.
- Restaurant category filtering.
- Restaurant card and map marker synchronization.
- Missing Geoapify API key.
- Geoapify API failure.
- Overpass fallback.
- Cached results fallback.
- No available restaurants.
- Missing menu information.
- Existing dish search and budget filtering.
- Mobile and desktop responsiveness.

Run:

```bash
npm run lint
npm run build
```

Fix any errors introduced by the implementation.

Do not claim that live API testing passed unless it was actually performed.

## 14. Documentation

Update the README with a beginner-friendly setup guide covering:

- How to register for a free Geoapify account.
- How to create a project and obtain an API key.
- How to configure `.env.local`.
- How to start the application.
- How to test restaurant discovery.
- How fallback services work.
- API limits and restrictions.
- Common troubleshooting steps.
- Menu data limitations.

## Final Requirements

- Focus only on fixing and improving API integration and its related functionality.
- Preserve the existing UI, pages, and working features.
- Do not introduce authentication, payment systems, delivery features, or a new backend.
- Use free-tier and open-data services only.
- Keep the implementation simple, maintainable, and beginner-friendly.
- Do not fabricate restaurant or menu data.

After implementation, provide a concise summary of:

1. Root cause of the existing integration problems, if identified.
2. Files created and modified.
3. Features implemented.
4. Required environment configuration.
5. Testing results.
6. Remaining limitations or issues.