import Joi from 'joi';

export const updateProfileParamsSchema = Joi.object({
  mosqueId: Joi.string().uuid().required()
});

export const updateProfileBodySchema = Joi.object({
  imageUrl: Joi.string().uri().required(),
  publicId: Joi.string().required()
});