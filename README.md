
# mame-genius

## Setup

```bash
npm install
make wasm # emscripten switchres build 
```

## Run

```bash
npm start
```

## Build/Release

```bash
make wasm # emscripten switchres build 
npm run lint
npm run lint-node
npm run build
cp dist/* ...
```

## Data Files
### `data/mameList.filtered.partial.min.json`

```bash
mame.exe -listxml | node ../controls-dat-json/tools/listXMLToJSON.js -props name,isbios,isdevice,ismechanical,description,year,manufacturer,displays,driver,cloneof -min | node tools/filterMAMEListJSON.js -min > data/mameList.filtered.partial.min.json
```

### `data/controls.filtered.partial.min.json`

```bash
cat ../controls-dat-json/json/restructuredControls.json | node tools/filterControlsJSON.js -min > data/controls.filtered.partial.min.json
```

### `data/controlsDefMap.json`

```bash
cp ../controls-dat-json/json/controlsDefMap.json data/
```