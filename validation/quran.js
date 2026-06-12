import Joi from 'joi';

export const surahParamsSchema = Joi.object({
  id: Joi.number().integer().min(1).max(114).required()
});

export const versesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(286).default(20)
});