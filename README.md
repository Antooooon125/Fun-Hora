# Fun-Hora

**[Open Fun-Hora](https://antooooon125.github.io/Fun-Hora/)**

Developed in part by **Amnuayvit Thitibordin**. Fun-Hora is a work in progress. Calculations and displays may contain errors. [Report an issue](https://github.com/Antooooon125/Fun-Hora/issues).

Fun-Hora is a browser-based Jyotish chart workbench with Thai round and square chart styles, 20 vargas, Jaimini analysis, and Vimshottari dasha. Enter your birth date in DD/MM/YYYY format, local time, and location to calculate a chart. Choose a Thai province and district, enter coordinates, or use **Pin on map** to select a birthplace on OpenStreetMap. A Thai district selection uses its approximate center and sets the time zone to Asia/Bangkok. Use a map pin for a more precise birthplace. You can adjust placements in the editor, save a chart as JSON, and print it.

## Use and sharing

The hosted Fun-Hora app is free for personal and commercial use. Selling Fun-Hora or copies of it is prohibited. You may share and adapt Fun-Hora’s original materials with credit and under the same terms. XALEN and other third-party materials are governed by their respective licenses. [XALEN license](LICENSE) · [Notices](NOTICE) · [Calculation methods](calculation-methods.html)

## What's new in v4.2

- Planetary and ascendant longitudes keep their full precision through varga, nakshatra, and dasha calculations. The position editor displays degrees and whole minutes.
- City presets select a historical IANA time zone. You can also enter a zone or use a manual UTC offset. When a local time repeats, Fun-Hora shows both candidate offsets.
- Chart settings show the resolved UTC instant and calculation choices. JSON saves preserve those settings, and an invalid import leaves the open chart in place.

## Special Lagnas

The **Special Lagnas** section shows Hora Lagna (HL) and Ghati Lagna (GL). Both start at the sidereal Sun's longitude at the most recent sunrise, using the selected ayanamsa. HL advances one sign per 60 minutes and GL advances one sign per 24 minutes. A pre-sunrise birth uses the previous sunrise. XALEN modes use XALEN's standard apparent sunrise at sea level. The Suriyayatra workbook mode uses the workbook’s sunrise and solar longitude, including its whole-minute sunrise rounding. [Hora Lagna verses](https://www.siva.sh/brihat-parashara-hora-shastra/5/1-5) · [Ghati Lagna verses](https://www.siva.sh/brihat-parashara-hora-shastra/5/6-10)

## How Fun-Hora uses XALEN

Fun-Hora is the Jyotish chart app. XALEN Ephemeris is the reusable calculation library behind it. Fun-Hora runs XALEN in your browser to calculate planetary positions and speeds, the ascendant, and ayanamsa. Fun-Hora then applies its chart rules to those values.

- **Vargas**. Fun-Hora divides zodiac signs into smaller sections and uses the exact positions to place planets in divisional charts such as D9 and D60.
- **Jaimini**. Fun-Hora assigns roles such as Atmakaraka using the selected seven- or eight-karaka convention.
- **Vimshottari**. The Moon’s birth nakshatra determines the first dasha ruler. The Moon’s progress through that nakshatra determines how much of the first period remains.
- **Thai chart rules**. Fun-Hora draws the round and square Thai charts and displays Taksa roles and วิษะ markers.

### Suriyayatra workbook method

**Suriyayatra (สุริยยาตร์)** is the default for new charts. Use the switch beside the calculation menu to compare with XALEN Lahiri. The workbook mode uses its standard natal settings for the ascendant, the seven classical planets, Rahu, Ketu, Uranus, and all 20 displayed divisional charts. Chart longitudes are calculated directly in the sidereal zodiac. The workbook’s D2 and node conventions are used automatically.

HL and GL use Fun-Hora’s special-Lagna rules with the workbook’s sunrise and solar longitude. The reference workbook has no dedicated HL or GL outputs to compare against. Jaimini, Vimshottari, and other interpretation panels apply Fun-Hora’s existing rules to the selected chart.

The original workbook is credited to Woraphon Maison (วรพล ไม้สน).

Chart calculations run on your device. The optional **Find** button sends the location search text to OpenStreetMap's Nominatim service. Preset cities and manual coordinates work without that lookup. [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)

The Thai selector covers 77 provincial-level areas (including Bangkok) and 928 districts. Names, codes, and centroids are adapted from William J. Reynolds’s [Thailand Canonical Administrative-Names Reference](https://doi.org/10.5281/zenodo.20049930) ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), using source revision [5c611f8](https://github.com/DevelopedbyWill/thailand-canonical-admin-names/tree/5c611f8cd92691bdc62d7492983480516b00500d). The province and district CSV columns were reduced and grouped into JSON. [Upstream attributions](https://github.com/DevelopedbyWill/thailand-canonical-admin-names/blob/5c611f8cd92691bdc62d7492983480516b00500d/NOTICE.md).

The Pages workflow builds XALEN, verifies the browser bindings, and publishes Fun-Hora. See the [XALEN library documentation](XALEN.md), [license](LICENSE), and [notices](NOTICE) for the underlying project.
