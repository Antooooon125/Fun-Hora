# Fun-Hora

**[Open Fun-Hora](https://antooooon125.github.io/Fun-Hora/)**

Fun-Hora is a browser-based Jyotish chart workbench with Thai round and square chart styles, 20 vargas, Jaimini analysis, and Vimshottari dasha. Enter your birth date, local time, and location to calculate a chart. You can adjust placements in the editor, save a chart as JSON, and print it.

## What's new in v4.2

- Planetary and ascendant longitudes keep their full precision through varga, nakshatra, and dasha calculations. The position editor displays degrees and whole minutes.
- City presets select a historical IANA time zone. You can also enter a zone or use a manual UTC offset. When a local time repeats, Fun-Hora shows both candidate offsets.
- Chart settings show the resolved UTC instant and calculation choices. JSON saves preserve those settings, and an invalid import leaves the open chart in place.

## Calculation engine

Fun-Hora uses XALEN Ephemeris, compiled to WebAssembly from this repository, for astronomical positions, speeds, the ascendant, and ayanamsa. Fun-Hora applies its own varga, Jaimini, Vimshottari, and Thai chart rules. Thai Suriyayart uses Fun-Hora's custom Lahiri − 0.592° convention.

Chart calculations run on your device. The optional **Find** button sends the location search text to OpenStreetMap's Nominatim service. Preset cities and manual coordinates work without that lookup. [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)

The Pages workflow builds XALEN, verifies the browser bindings, and publishes Fun-Hora. See the [XALEN library documentation](XALEN.md), [license](LICENSE), and [notices](NOTICE) for the underlying project.
