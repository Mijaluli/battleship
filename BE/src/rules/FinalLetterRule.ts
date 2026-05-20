import { IValidationRule } from '../domain/IValidationRule';
import { ILanguage } from '../domain/ILanguage';

export class FinalLetterRule implements IValidationRule {
  validate(word: string, language: ILanguage): boolean {
    const last = language.getLetter(word[word.length - 1]);
    return !!last && last.canBeFinal && last.canStart;
  }
}
