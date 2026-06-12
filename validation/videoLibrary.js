import Joi from 'joi';

export const videoLibraryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  search: Joi.string().allow('').optional()
});

export const lectureIdParamsSchema = Joi.object({
  lectureId: Joi.string().uuid().required()
});