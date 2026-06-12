import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  imageUrl: Joi.string().uri().required(),
  publicId: Joi.string().required()
});