import IMultidimensionalScore from './types/multidimensionalScore';
import {EnumValue} from './types/enum';


/**
 * @param  {...[string, number | IMultidimensionalScore | EnumValue<number>]} entries 
 * @returns {IMultidimensionalScore}
 */
export function createScore(...entries) {
  /** @type {IMultidimensionalScore} */
  const score = {dims: []};
  
  for (let i = 0; i < entries.length; ++i) {
    const [key, ival] = entries[i];
    
    const val = ival instanceof EnumValue? ival.val: ival;
    
    if (typeof val === 'number' && val < 0) {
      throw new Error(`Negative score value. entries[${i}][1]`);
    }
    
    score.dims.push({key, val});
  }
  
  return score;
}

/**
 * @param  {...IMultidimensionalScore} scores 
 * @returns {IMultidimensionalScore}
 */
export function sumScores(...scores) {
  /** @type {IMultidimensionalScore} */
  const sumScore = {dims: []};
  
  // find the first non-empty score
  let keyScoreIndex = 0;
  while (keyScoreIndex < scores.length && scores[keyScoreIndex].dims.length === 0) {
    ++keyScoreIndex;
  }
  
  if (keyScoreIndex === scores.length) {
    return sumScore;
  }
  
  // copy values from key score
  for (let dimIndex = 0; dimIndex < scores[keyScoreIndex].dims.length; ++dimIndex) {
    const dim = scores[keyScoreIndex].dims[dimIndex];
    
    sumScore.dims[dimIndex] = {
      key: dim.key,
      val: dim.val
    };
  }
  
  for (let scoreIndex = keyScoreIndex + 1; scoreIndex < scores.length; ++scoreIndex) {
    // empty scores (scores with 0 dimensions) should be treated as all 0s and ignored
    if (scores[scoreIndex].dims.length === 0) {
      continue;
    }
    
    for (let dimIndex = 0; dimIndex < sumScore.dims.length; ++dimIndex) {
      const dim = scores[scoreIndex].dims[dimIndex];
      if (!dim) {
        throw new Error(`Attempting to add scores of different sizes. scores[${keyScoreIndex}].dims.length === ${sumScore.dims.length}, scores[${scoreIndex}].dims.length === ${scores[scoreIndex].dims.length}`);
      }
      
      const sumDim = sumScore.dims[dimIndex];
      if (sumDim.key !== dim.key) {
        throw new Error(`Attempting to add scores with different structures. scores[${keyScoreIndex}].dims[${dimIndex}].key === '${sumDim.key}', scores[${scoreIndex}].dims[${dimIndex}].key === '${dim.key}'`);
      }
      
      if (
        typeof sumDim.val === 'number' &&
        typeof    dim.val === 'number'
      ) {
        sumDim.val += dim.val;
      }
      else if (
        typeof sumDim.val !== 'number' &&
        typeof    dim.val !== 'number'
      ) {
        sumDim.val = sumScores(sumDim.val, dim.val);
      }
      else {
        throw new Error(`Attempting to add scores with different structures. typeof scores[${keyScoreIndex}].dims[${dimIndex}].val === ${typeof sumDim.val}, typeof scores[${scoreIndex}].dims[${dimIndex}].val === ${typeof dim.val}`);
      }
    }
  }
  
  return sumScore;
}

/**
 * @param {IMultidimensionalScore} scoreA 
 * @param {IMultidimensionalScore} scoreB 
 * @returns {-1|0|1}
 */
export function compareScores(scoreA, scoreB) {
  // empty scores (scores with 0 dimensions) should always compare lower
  const scoreAIsEmpty = scoreA.dims.length === 0;
  const scoreBIsEmpty = scoreB.dims.length === 0;
  if (scoreAIsEmpty && scoreBIsEmpty) return 0;
  if (scoreAIsEmpty) return -1;
  if (scoreBIsEmpty) return 1;
 
  if (scoreA.dims.length !== scoreB.dims.length) {
    throw new Error(`Attempting to compare scores of different sizes. scoreA.dims.length === ${scoreA.dims.length}, scoreB.dims.length === ${scoreB.dims.length}`);
  }
  
  for (let dimIndex = 0; dimIndex < scoreA.dims.length; ++dimIndex) {
    const dimA = scoreA.dims[dimIndex];
    const dimB = scoreB.dims[dimIndex];
    
    if (dimA.key !== dimB.key) {
      throw new Error(`Attempting to add scores with different structures. scoreA.dims[${dimIndex}].key === ${dimA.key}, scoreB.dims[${dimIndex}].key === ${dimB.key}`);
    }
    
    if (
      typeof dimA.val === 'number' &&
      typeof dimB.val === 'number'
    ) {
      if (dimA.val < dimB.val) {
        return -1;
      }
      if (dimA.val > dimB.val) {
        return 1;
      }
    }
    else if (
      typeof dimA.val !== 'number' &&
      typeof dimB.val !== 'number'
    ) {
      const diff = compareScores(dimA.val, dimB.val);
      if (diff !== 0) {
        return diff;
      }
    }
    else {
      throw new Error(`Attempting to add scores with different structures. typeof scoreA.dims[${dimIndex}].val === ${typeof dimA.val}, typeof scoreB.dims[${dimIndex}].val === ${typeof dimB.val}`);
    }
  }
  
  return 0;
}
