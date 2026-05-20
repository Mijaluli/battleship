import { LetterDefinition } from './LetterDefinition';

export interface ILanguage {
  getLetter(char: string): LetterDefinition | undefined;
}
