import { expect } from 'chai';
import { FinalLetterRule } from '../../src/rules/FinalLetterRule';
import { exampleLanguage } from '../../src/language/languages/exampleLanguage';

describe('FinalLetterRule', () => {
  const rule = new FinalLetterRule();

  describe('letters where canBeFinal is true', () => {
    it('returns true when word ends with "a" (canBeFinal: true)', () => {
      expect(rule.validate('a', exampleLanguage)).to.be.true;
    });

    it('returns true when a multi-char word ends with "a"', () => {
      expect(rule.validate('ba', exampleLanguage)).to.be.true;
    });

    it('returns true when word ends with "c" (canBeFinal: true)', () => {
      expect(rule.validate('c', exampleLanguage)).to.be.true;
    });

    it('returns true when a multi-char word ends with "c"', () => {
      expect(rule.validate('ac', exampleLanguage)).to.be.true;
    });
  });

  describe('letters where canBeFinal is false', () => {
    it('returns false when word ends with "b" (canBeFinal: false)', () => {
      expect(rule.validate('b', exampleLanguage)).to.be.false;
    });

    it('returns false when a multi-char word ends with "b"', () => {
      expect(rule.validate('ab', exampleLanguage)).to.be.false;
    });
  });

  describe('unknown final letters', () => {
    it('returns false when the last letter is not defined in the language', () => {
      expect(rule.validate('az', exampleLanguage)).to.be.false;
    });

    it('returns false for a single unknown letter', () => {
      expect(rule.validate('z', exampleLanguage)).to.be.false;
    });
  });
});
