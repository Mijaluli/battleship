import { IValidationRule } from '../domain/IValidationRule';
import { ILanguage } from '../domain/ILanguage';

export class FollowerRule implements IValidationRule {
  validate(word: string, language: ILanguage): boolean {
    for (let i = 1; i < word.length; i++) {
      const prev = language.getLetter(word[i - 1]);
      if (!prev || !prev.followers.has(word[i])) {
        return false;
      }
    }
    return true;
  }
}
