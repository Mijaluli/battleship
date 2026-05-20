import { exampleLanguage } from './language/languages/exampleLanguage';
import { FollowerRule } from './rules/FollowerRule';
import { FinalLetterRule } from './rules/FinalLetterRule';
import { WordValidator } from './validator/WordValidator';
import { startServer } from './http/server';

const validator = new WordValidator(exampleLanguage, [
  new FollowerRule(),
  new FinalLetterRule(),
]);

const port = Number(process.env.PORT ?? 3000);
startServer(validator, port);
