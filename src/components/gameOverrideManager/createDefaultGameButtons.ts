import {IGameButton} from '../../types/game';


export default function createDefaultGameButtons(numButtons: number): IGameButton[] {
  return Array(numButtons).fill({
    descriptor: undefined,
    input: {
      isAnalog: false,
      label   : undefined
    }
  });
}