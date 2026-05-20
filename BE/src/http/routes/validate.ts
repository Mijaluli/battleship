import { Router, Request, Response } from 'express';
import { WordValidator } from '../../validator/WordValidator';

export function createValidateRouter(validator: WordValidator): Router {
  const router = Router();

  router.get('/validate', (req: Request, res: Response) => {
    const word = String(req.query.word ?? '');
    res.json({ valid: validator.isValid(word) });
  });

  return router;
}
