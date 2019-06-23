import './machineNameList.less';
import machineNameListTemplate from './machineNameList.html';
import htmlToBlock from '../../helpers/htmlToBlock';


export default class MachineNameList {
  constructor() {
    this.block = htmlToBlock(machineNameListTemplate);
    this.inputElem = this.block.getElementById('machine-name-list__input');
    this.demoListLinkElem = this.block.getElementById('machine-name-list__demo-list-link');
    
    this.demoListLinkElem.addEventListener('click', e => {
      e.preventDefault();
      this.inputElem.value = getDefaultMachineNameInputsStr();
    });
  }
  
  init() {
    this.inputElem.value = this.loadState() || getDefaultMachineNameInputsStr();
  }
  
  /**
   * @returns {string[]}
   */
  getMachineNameInputs() {
    // parse input into machine names
    return this.parseInput(this.inputElem.value);
  }

  /**
   * @param {string} machineNameListInput 
   * @returns {string[]}
   */
  parseInput(machineNameListInput) {
    return (
      machineNameListInput
      .replace(/,/g, '\n')           // replace commas with newlines
      .split('\n')                   // split by lines
      .map(str => str.trim())        // trim lines
      .filter(str => str.length > 0) // remove empty lines
      .filter((str, i, strs) =>      // remove duplicates
        strs.indexOf(str) === i
      )
    );
  }
  
  saveState() {
    window.localStorage.setItem('machineNameListInput', this.inputElem.value);
  }
  
  /**
   * @returns {string}
   */
  loadState() {
    return window.localStorage.getItem('machineNameListInput') || '';
  }
}

function getDefaultMachineNameInputsStr() {
  return `1941
1942
1943
1944
1945kiii
88games
area51
arkanoid
asteroid
bosco
btoads
bubbles
bublbob2
bublbobl
centiped
defender
digdug2
digdug
dkong
dlair
elevator
frogger
galaga
galaxian
gauntlet
invaders
joust
llander
milliped
missile
mk
mpatrol
mslug
mspacman
pacman
paperboy
phoenix
policetr
qbert
rampage
sbrkout
shollow
simpsons
snowbros
ssriders
tapper
tempest
temptube
timecris
tmnt
tron
`;
}