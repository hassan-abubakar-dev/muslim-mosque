import Joi from 'joi';

export const toggleBookmarkSchema = Joi.object({
  lastPosition: Joi.number().min(0).default(0),
});

export const lectureIdParamSchema = Joi.object({
  lectureId: Joi.string().uuid().required(),
});

export const getBookmarksSchema = Joi.object({
  search: Joi.string().trim().allow('').optional(),
  type: Joi.string().valid('video', 'audio').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});