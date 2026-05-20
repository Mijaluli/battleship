# Language Validator API

An HTTP service that validates words against a pluggable set of language rules.

## Quick start

```bash
npm install
npm run dev          # hot-reload dev server on port 3000
# or
npm run build && npm start   # compile then run
```

The server starts on `http://localhost:3000` by default.  
Set `PORT` to change the port: `PORT=4000 npm run dev`.

## API

### `GET /validate?word=<word>`

Returns whether the word is valid according to the current language rules.

**Response**

```json
{ "valid": true }
```

**Examples**

```bash
# ac  – c is not a follower of a  →  false
curl "http://localhost:3000/validate?word=ac"
# {"valid":false}

# ab  – b cannot be a final letter  →  false
curl "http://localhost:3000/validate?word=ab"
# {"valid":false}

# aba – followers ok, a can be final  →  true
curl "http://localhost:3000/validate?word=aba"
# {"valid":true}
```

## Project structure

```
src/
  domain/
    LetterDefinition.ts   – shape of a single letter's rules
    ILanguage.ts          – interface: getLetter(char) → LetterDefinition | undefined
    IValidationRule.ts    – interface: validate(word, language) → boolean
  language/
    Language.ts           – concrete ILanguage backed by a Map
    languages/
      exampleLanguage.ts  – the language from the brief (a/b/c)
  rules/
    FollowerRule.ts       – each character's successor must be in the previous char's followers
    FinalLetterRule.ts    – the last character must have canBeFinal === true
  validator/
    WordValidator.ts      – composes ILanguage + IValidationRule[]; exposes isValid(word)
  http/
    server.ts             – Express app factory and server bootstrap
    routes/validate.ts    – GET /validate route
  index.ts                – wires everything together and starts the server
```

## How to add a new rule

1. Create a file in `src/rules/`, e.g. `src/rules/MaxLengthRule.ts`:

```ts
import { IValidationRule } from '../domain/IValidationRule';
import { ILanguage } from '../domain/ILanguage';

export class MaxLengthRule implements IValidationRule {
  constructor(private readonly max: number) {}

  validate(word: string, _language: ILanguage): boolean {
    return word.length <= this.max;
  }
}
```

2. Add it to the rules array in `src/index.ts`:

```ts
import { MaxLengthRule } from './rules/MaxLengthRule';

const validator = new WordValidator(exampleLanguage, [
  new FollowerRule(),
  new FinalLetterRule(),
  new MaxLengthRule(10),   // ← new rule
]);
```

No other files need to change.

## How to switch languages

1. Create a new file in `src/language/languages/`, e.g. `src/language/languages/germanLanguage.ts`:

```ts
import { Language } from '../Language';

export const germanLanguage = new Language(
  new Map([
    ['a', { followers: new Set(['b', 'c']), canBeFinal: true }],
    // … define all letters
  ])
);
```

2. Import it in `src/index.ts` instead of `exampleLanguage`:

```ts
import { germanLanguage } from './language/languages/germanLanguage';

const validator = new WordValidator(germanLanguage, [
  new FollowerRule(),
  new FinalLetterRule(),
]);
```

## Complexity

Validation runs in **O(k)** time where `k` is the word length.  
Each rule performs at most one linear scan with O(1) `Set` lookups per character.  
The total cost is O(R · k) with R being the (constant) number of rules, which simplifies to O(k).
