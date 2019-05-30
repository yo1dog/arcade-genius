/* 
 * Usage: node filterMAMEListJSON.js
 * 
 * Filters out unneeded data from mameList.json [--min]
 * 
 * You can generate mameList.json using the controls.dat JSON project:
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
`node filterMAMEListJSON.js [--min]

bash:
cat mameList.json | node filterMAMEListJSON.js > mameList.filtered.partial.json
cat mameList.json | node filterMAMEListJSON.js --min > mameList.filtered.partial.min.json

Windows Command Prompt:
type mameList.json | node filterMAMEListJSON.js > mameList.filtered.partial.json
type mameList.json | node filterMAMEListJSON.js --min > mameList.filtered.partial.min.json

!! Windows PowerShell !!:
cat mameList.json | node filterMAMEListJSON.js | Out-File -Encoding utf8 mameList.filtered.partial.json
cat mameList.json | node filterMAMEListJSON.js --min | Out-File -Encoding utf8 mameList.filtered.partial.min.json`;


(async function run() {
  const prettyPrint = !process.argv.some(arg => /-?-min/i.test(arg));
  
  const stdinStr = await readStdin()
  .catch(err => {throw new CError(err, `Error reading stdin.`);});
  
  if (!stdinStr) {
    console.error('Nothing piped to stdin.');
    console.error(`Usage:\n${usageExampleStr}`);
    process.exit(1);
  }
  
  let mameList;
  try {
    mameList = JSON.parse(stdinStr);
  }
  catch(err) {
    throw new CError(err, 'Error parsing data from stdin as JSON.');
  }
  
  filterMAMEList(mameList);
  
  console.log(JSON.stringify(mameList, null, prettyPrint? '  ' : null));
})()
.then(() => {
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});

function filterMAMEList(mameList) {
  mameList.machines = mameList.machines.filter(machine =>
    // remove all machines that are not "games"
    !machine.isbios &&
    !machine.isdevice &&
    !machine.ismechanical
  );
  
  mameList.machines.forEach(machine => {
    // delete unneeded properties
    delete machine.isbios;
    delete machine.isdevice;
    delete machine.ismechanical;
  });
}