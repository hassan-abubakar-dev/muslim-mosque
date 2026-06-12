import Joi from 'joi';

export const verifyEmailSchema = Joi.object({
  verificationCode: Joi.string().length(6).required()
});

export const verifyRecoverySchema = Joi.object({
  verificationCode: Joi.string().length(6).required(),
  email: Joi.string().email().required()
});