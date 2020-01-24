/* 
 * Usage: node filterControlsJSON.js
 * 
 * Filters out unneeded data from restructuredControls.json [--min]
 * 
 * You can get restructuredControls.json from the controls.dat JSON project:
 * https://github.com/yo1dog/controls-dat-json
 * 
 * 
 * 
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!         WARNING          !!
 * !!                          !!
 * !! Windows PowerShell Users !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * 
 * You can not use the > operator to write the output SQL to a file as it will be
 * saved with UTF-8-BOM encoding which will make it invalid SQL. Using
 * "| Out-File -Encoding utf8" instead solves this problem.
 */

const readStdin = require('./readStdin');
const CError    = require('@yo1dog/cerror');

const usageExampleStr =
`node filterControlsJSON.js [--min]

bash:
cat restructuredControls.json | node filterControlsJSON.js > controls.filtered.partial.json
cat restructuredControls.json | node filterControlsJSON.js --min > controls.filtered.partial.min.json

Windows Command Prompt:
type restructuredControls.json | node filterControlsJSON.js > controls.filtered.partial.json
type restructuredControls.json | node filterControlsJSON.js --min > controls.filtered.partial.min.json

!! Windows PowerShell !!:
cat restructuredControls.json | node filterControlsJSON.js | Out-File -Encoding utf8 controls.filtered.partial.json
cat restructuredControls.json | node filterControlsJSON.js --min | Out-File -Encoding utf8 controls.filtered.partial.min.json`;


(async function run() {
  const prettyPrint = !process.argv.some(arg => /-?-min/i.test(arg));
  
  const stdinStr = await readStdin()
  .catch(err => {throw new CError(err, `Error reading stdin.`);});
  
  if (!stdinStr) {
    console.error('Nothing piped to stdin.');
    console.error(`Usage:\n${usageExampleStr}`);
    process.exit(1);
  }
  
  let controlsDat;
  try {
    controlsDat = JSON.parse(stdinStr);
  }
  catch(err) {
    throw new CError(err, 'Error parsing data from stdin as JSON.');
  }
  
  filterControlsDat(controlsDat);
  
  console.log(JSON.stringify(controlsDat, null, prettyPrint? 2 : undefined));
})()
.then(() => {
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});

/** @param {any} controlsDat */
function filterControlsDat(controlsDat) {
  for (const gameName in controlsDat.gameMap) {
    const game = controlsDat.gameMap[gameName];
    
    delete game.usesServiceButtons;
    delete game.usesTilt;
    delete game.hasCocktailDipswitch;
    delete game.notes;
    delete game.errors;
    
    for (const controlConfiguration of game.controlConfigurations) {
      delete controlConfiguration.notes;
    }
  }
}