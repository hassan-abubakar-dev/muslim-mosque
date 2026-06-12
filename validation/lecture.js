import Joi from 'joi';

export const lectureParamsSchema = Joi.object({
  categoryId: Joi.string().uuid().required(),
  lectureId: Joi.string().uuid().optional() // for deletion
});

export const saveLectureSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required(),
  type: Joi.string().valid('audio', 'video').required(),
  mosqueId: Joi.string().uuid().required(),
  
  // Audio specific
  key: Joi.string().when('type', { is: 'audio', then: Joi.required() }),
  duration: Joi.number().when('type', { is: 'audio', then: Joi.required() }),
  
  // Video specific
  videoId: Joi.string().when('type', { is: 'video', then: Joi.required() }),
  thumbnail: Joi.string().uri().optional(),
});

export const getLecturesQuerySchema = Joi.object({
  userId: Joi.string().uuid().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  search: Joi.string().trim().allow(''),
  type: Joi.string().valid('audio', 'video').optional()
});