# Fun-Hora

**[Open Fun-Hora](https://antooooon125.github.io/Fun-Hora/)**

Fun-Hora is a browser-based Jyotish chart workbench with Thai round and square chart styles, 20 vargas, Jaimini analysis, and Vimshottari dasha. Enter your birth date, local time, and location to calculate a chart. You can adjust placements in the editor, save a chart as JSON, and print it.

## What's new in v4.2

- Planetary and ascendant longitudes keep their full precision through varga, nakshatra, and dasha calculations. The position editor displays degrees and whole minutes.
- City presets select a historical IANA time zone. You can also enter a zone or use a manual UTC offset. When a local time repeats, Fun-Hora shows both candidate offsets.
- Chart settings show the resolved UTC instant and calculation choices. JSON saves preserve those settings, and an invalid import leaves the open chart in place.

## How Fun-Hora uses XALEN

Fun-Hora is the Jyotish chart app. XALEN Ephemeris is the reusable calculation library behind it. Fun-Hora runs XALEN in your browser to calculate planetary positions and speeds, the ascendant, and ayanamsa. Fun-Hora then applies its chart rules to those values.

- **Vargas**. Fun-Hora divides zodiac signs into smaller sections and uses the exact positions to place planets in divisional charts such as D9 and D60.
- **Jaimini**. Fun-Hora assigns roles such as Atmakaraka using the selected seven- or eight-karaka convention.
- **Vimshottari**. The Moon’s birth nakshatra determines the first dasha ruler. The Moon’s progress through that nakshatra determines how much of the first period remains.
- **Thai chart rules**. Fun-Hora draws the round and square Thai charts and displays Taksa roles and วิษะ markers.

### What the Thai Suriyayart setting changes

An ayanamsa is the angle subtracted from a tropical longitude to get a sidereal longitude. Fun-Hora’s Thai Suriyayart setting reduces XALEN’s Lahiri ayanamsa for the birth date by 0.592° (about 35′31″). For example, if Lahiri is 24.000°, Fun-Hora uses 23.408°. Subtracting a smaller angle moves the sidereal positions forward by 0.592° compared with Lahiri. A placement close to a sign, varga, or nakshatra boundary can therefore change.

This fixed offset is Fun-Hora’s convention. Its agreement with a traditional Suriyayart reference has yet to be independently verified.

Chart calculations run on your device. The optional **Find** button sends the location search text to OpenStreetMap's Nominatim service. Preset cities and manual coordinates work without that lookup. [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)

The Pages workflow builds XALEN, verifies the browser bindings, and publishes Fun-Hora. See the [XALEN library documentation](XALEN.md), [license](LICENSE), and [notices](NOTICE) for the underlying project.
