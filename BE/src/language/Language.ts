import { ILanguage } from '../domain/ILanguage';
import { LetterDefinition } from '../domain/LetterDefinition';

export class Language implements ILanguage {
  constructor(private readonly letters: Map<string, LetterDefinition>) {}

  getLetter(char: string): LetterDefinition | undefined {
    return this.letters.get(char);
  }
}
