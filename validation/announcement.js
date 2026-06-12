import Joi from 'joi';

export const announcementSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required(),
  content: Joi.string().trim().min(5).max(2000).required(),
  imageUrl: Joi.string().uri().optional().allow(null, ''),
  publicId: Joi.string().optional().allow(null, '')
});

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

export const mosqueIdParamSchema = Joi.object({
  mosqueId: Joi.string().uuid().required()
});

export const announcementIdParamSchema = Joi.object({
  id: Joi.string().uuid().required()
})