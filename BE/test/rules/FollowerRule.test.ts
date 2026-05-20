import { expect } from 'chai';
import { FollowerRule } from '../../src/rules/FollowerRule';
import { exampleLanguage } from '../../src/language/languages/exampleLanguage';

describe('FollowerRule', () => {
  const rule = new FollowerRule();

  describe('single character words', () => {
    it('returns true for a single known letter (no pairs to check)', () => {
      expect(rule.validate('a', exampleLanguage)).to.be.true;
    });

    it('returns true for a single letter even if it has restricted followers', () => {
      expect(rule.validate('b', exampleLanguage)).to.be.true;
    });
  });

  describe('valid follower pairs', () => {
    it('"ab" – b is in a\'s followers', () => {
      expect(rule.validate('ab', exampleLanguage)).to.be.true;
    });

    it('"aa" – a is in a\'s followers', () => {
      expect(rule.validate('aa', exampleLanguage)).to.be.true;
    });

    it('"ad" – d is in a\'s followers', () => {
      expect(rule.validate('ad', exampleLanguage)).to.be.true;
    });

    it('"ba" – a is in b\'s followers', () => {
      expect(rule.validate('ba', exampleLanguage)).to.be.true;
    });

    it('"ca" – a is in c\'s followers', () => {
      expect(rule.validate('ca', exampleLanguage)).to.be.true;
    });

    it('"aba" – a→b ok, b→a ok', () => {
      expect(rule.validate('aba', exampleLanguage)).to.be.true;
    });

    it('"aab" – a→a ok, a→b ok', () => {
      expect(rule.validate('aab', exampleLanguage)).to.be.true;
    });
  });

  describe('invalid follower pairs', () => {
    it('"ac" – c is not in a\'s followers', () => {
      expect(rule.validate('ac', exampleLanguage)).to.be.false;
    });

    it('"bc" – c is not in b\'s followers', () => {
      expect(rule.validate('bc', exampleLanguage)).to.be.false;
    });

    it('"cb" – b is not in c\'s followers (only a is)', () => {
      expect(rule.validate('cb', exampleLanguage)).to.be.false;
    });
  });

  describe('unknown letters', () => {
    it('returns false when the first letter is unknown to the language', () => {
      expect(rule.validate('za', exampleLanguage)).to.be.false;
    });

    it('returns false when a successor letter is unknown to the language', () => {
      expect(rule.validate('az', exampleLanguage)).to.be.false;
    });
  });
});
