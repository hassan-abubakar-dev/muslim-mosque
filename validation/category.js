import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  teacherName: Joi.string().trim().min(2).max(100).required(),
  information: Joi.string().trim().max(1000).allow('', null).optional(),
  imageUrl: Joi.string().uri().optional().allow('', null),
  publicId: Joi.string().optional().allow('', null)
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  teacherName: Joi.string().trim().min(2).max(100).optional(),
  information: Joi.string().trim().max(1000).allow('', null).optional(),
  imageUrl: Joi.string().uri().optional().allow('', null),
  publicId: Joi.string().optional().allow('', null)
}).min(1);

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const mosqueIdParamSchema = Joi.object({
  mosqueId: Joi.string().uuid().required()
});