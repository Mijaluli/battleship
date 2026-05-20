import express from 'express';
import { WordValidator } from '../validator/WordValidator';
import { createValidateRouter } from './routes/validate';

export function createApp(validator: WordValidator): express.Application {
  const app = express();

  app.use(express.json());
  app.use('/', createValidateRouter(validator));

  return app;
}

export function startServer(validator: WordValidator, port = 3000): void {
  const app = createApp(validator);
  app.listen(port, () => {
    console.log(`Language Validator API listening on http://localhost:${port}`);
  });
}
