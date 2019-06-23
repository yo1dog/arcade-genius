
# mame-genius

## Build

```bash
npm install
(cd groovymame_0210_switchres; make prod)
npm run-script build
```

## Run

```bash
npm start
```

## Data Files
### `mameList.filtered.partial.min.json`

```bash
mame.exe -listxml | node ../controls-dat-json/tools/listXMLToJSON.js -props name,isbios,isdevice,ismechanical,description,year,manufacturer,displays,driver,cloneof -min | node tools/filterMAMEListJSON.js -min > data/mameList.filtered.partial.min.json
```

### `controls.filtered.partial.min.json`

```bash
cat ../controls-dat-json/json/restructuredControls.json | node tools/filterControlsJSON.js -min > data/controls.filtered.partial.min.json
```