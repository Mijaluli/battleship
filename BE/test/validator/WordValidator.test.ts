import { expect } from 'chai';
import { WordValidator } from '../../src/validator/WordValidator';
import { exampleLanguage } from '../../src/language/languages/exampleLanguage';
import { FollowerRule } from '../../src/rules/FollowerRule';
import { FinalLetterRule } from '../../src/rules/FinalLetterRule';

describe('WordValidator (exampleLanguage + default rules)', () => {
  const validator = new WordValidator(exampleLanguage, [
    new FollowerRule(),
    new FinalLetterRule(),
  ]);

  describe('examples from the brief', () => {
    it('"ac" is invalid – c is not a follower of a', () => {
      expect(validator.isValid('ac')).to.be.false;
    });

    it('"ab" is invalid – b cannot be a final letter', () => {
      expect(validator.isValid('ab')).to.be.false;
    });

    it('"aba" is valid – followers ok and a can be final', () => {
      expect(validator.isValid('aba')).to.be.true;
    });
  });

  describe('additional valid words', () => {
    it('"a" – single letter, a can be final', () => {
      expect(validator.isValid('a')).to.be.true;
    });

    it('"aa" – a→a valid follower, a can be final', () => {
      expect(validator.isValid('aa')).to.be.true;
    });

    it('"ba" – b→a valid follower, a can be final', () => {
      expect(validator.isValid('ba')).to.be.true;
    });

    it('"abaa" – all followers valid, ends with a', () => {
      expect(validator.isValid('abaa')).to.be.true;
    });

    it('"abaaba" – longer word, all rules pass', () => {
      expect(validator.isValid('abaaba')).to.be.true;
    });
  });

  describe('additional invalid words', () => {
    it('"b" – single letter, b cannot be final', () => {
      expect(validator.isValid('b')).to.be.false;
    });

    it('"aad" – a→a→d: d is a follower of a but d is unknown (canBeFinal undefined → false)', () => {
      expect(validator.isValid('aad')).to.be.false;
    });

    it('"cb" – c→b: b is not in c\'s followers', () => {
      expect(validator.isValid('cb')).to.be.false;
    });

    it('"za" – z is unknown, FollowerRule fails on first pair', () => {
      expect(validator.isValid('za')).to.be.false;
    });

    it('"az" – z is unknown as final letter', () => {
      expect(validator.isValid('az')).to.be.false;
    });
  });

  describe('edge cases', () => {
    it('empty string "" – no final letter → false', () => {
      expect(validator.isValid('')).to.be.false;
    });
  });

  describe('WordValidator with no rules', () => {
    it('returns true for any input when no rules are registered', () => {
      const noRulesValidator = new WordValidator(exampleLanguage, []);
      expect(noRulesValidator.isValid('anything')).to.be.true;
    });
  });
});
