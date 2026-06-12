import Joi from 'joi';

export const updateUserInfoSchema = Joi.object({
  firstName: Joi.string().min(2).optional(),
  surName: Joi.string().min(2).optional(),
  gender: Joi.string().valid('male', 'female').optional()
});

export const searchEmailSchema = Joi.object({
  email: Joi.string().email().required()
});

export const getUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  search: Joi.string().allow('').optional()
});

export const userIdParamsSchema = Joi.object({
  userId: Joi.string().uuid().required()
});