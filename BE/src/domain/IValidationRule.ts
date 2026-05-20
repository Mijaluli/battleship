import { ILanguage } from './ILanguage';

export interface IValidationRule {
  validate(word: string, language: ILanguage): boolean;
}
