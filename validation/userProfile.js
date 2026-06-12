import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  imageUrl: Joi.string().uri().required(),
  publicId: Joi.string().required(),
  metadata: Joi.object({
    size: Joi.number().required(),
    type: Joi.string().required(),
    lastModified: Joi.number().optional()
  }).required() // Required because it's now our security check
});