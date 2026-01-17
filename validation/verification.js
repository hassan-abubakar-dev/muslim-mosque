import Joi from 'joi';

export const verifyEmailSchema = Joi.object({
  verificationCode: Joi.string()
    .required()
    .messages({
      'string.pattern.base': 'Verification code must be 6 digits',
      'any.required': 'Verification code is required'
    })
});

