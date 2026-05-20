import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../../src/http/server';
import { WordValidator } from '../../src/validator/WordValidator';
import { exampleLanguage } from '../../src/language/languages/exampleLanguage';
import { FollowerRule } from '../../src/rules/FollowerRule';
import { FinalLetterRule } from '../../src/rules/FinalLetterRule';
import { describe, it } from 'node:test';

describe('GET /validate', () => {
  const validator = new WordValidator(exampleLanguage, [
    new FollowerRule(),
    new FinalLetterRule(),
  ]);
  const app = createApp(validator);

  describe('valid words', () => {
    it('returns { valid: true } for "aba"', async () => {
      const res = await request(app).get('/validate?word=aba');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ valid: true });
    });

    it('returns { valid: true } for "a"', async () => {
      const res = await request(app).get('/validate?word=a');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ valid: true });
    });

    it('returns { valid: true } for "aa"', async () => {
      const res = await request(app).get('/validate?word=aa');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ valid: true });
    });
  });

  describe('invalid words', () => {
    it('returns { valid: false } for "ac" (follower rule fails)', async () => {
      const res = await request(app).get('/validate?word=ac');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ valid: false });
    });

    it('returns { valid: false } for "ab" (final letter rule fails)', async () => {
      const res = await request(app).get('/validate?word=ab');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ valid: false });
    });

    it('returns { valid: false } for "b" (b cannot be final)', async () => {
      const res = await request(app).get('/validate?word=b');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ valid: false });
    });
  });

  describe('edge cases', () => {
    it('returns { valid: false } when word param is omitted (empty string)', async () => {
      const res = await request(app).get('/validate');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ valid: false });
    });

    it('returns { valid: false } for an unknown word', async () => {
      const res = await request(app).get('/validate?word=xyz');
      expect(res.status).to.equal(200);
      expect(res.body).to.deep.equal({ valid: false });
    });
  });
});
