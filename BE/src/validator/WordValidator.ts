import { ILanguage } from '../domain/ILanguage';
import { IValidationRule } from '../domain/IValidationRule';

export class WordValidator {
  constructor(
    private readonly language: ILanguage,
    private readonly rules: IValidationRule[]
  ) {}

  isValid(word: string): boolean {
    return this.rules.every((rule) => rule.validate(word, this.language));
  }
}
