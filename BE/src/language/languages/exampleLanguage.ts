import { Language } from '../Language';

export const exampleLanguage = new Language(
  new Map([
    ['a', { followers: new Set(['a', 'b', 'd']), canBeFinal: true , canStart: true}],
    ['b', { followers: new Set(['a', 'f']),       canBeFinal: false, canStart: false }],
    ['c', { followers: new Set(['a']),             canBeFinal: true, canStart: true }],
  ])
);
