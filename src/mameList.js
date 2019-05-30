/**
@typedef MAMEList
@property {string} build   
@property {boolean} debug   
@property {Machine[]} machines

@typedef Machine
@property {string} name         
@property {string} description  
@property {string} [year]        
@property {string} [manufacturer]
@property {string} cloneof      
@property {Display[]} displays     
@property {Driver} driver       

@typedef Display
@property {string} [tag]     
@property {'raster'|'vector'|'lcd'|'unknown'} type     
@property {0|90|180|270} rotate   
@property {boolean} flipx    
@property {number} [width]   
@property {number} [height]  
@property {number} refresh  
@property {number} [pixclock]
@property {number} [htotal]  
@property {number} [hbend]   
@property {number} [hbstart] 
@property {number} [vtotal]  
@property {number} [vbend]   
@property {number} [vbstart] 

@typedef Driver
@property {'good'|'imperfect'|'preliminary'} status           
@property {'good'|'imperfect'|'preliminary'} emulation        
@property {'good'|'imperfect'|'preliminary'} color            
@property {'good'|'imperfect'|'preliminary'} sound            
@property {'good'|'imperfect'|'preliminary'} graphic          
@property {'good'|'imperfect'|'preliminary'} [drivercocktail]  
@property {'good'|'imperfect'|'preliminary'} [driverprotection]
@property {'good'|'imperfect'|'preliminary'} savestate        
*/

import _mameList from '../data/mameList.filtered.partial.min.json';

/** @type {MAMEList} */
const mameList = _mameList;

export default mameList;