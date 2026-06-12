import Joi from 'joi';

export const submitFeedbackSchema = Joi.object({
  type: Joi.string().valid('bug', 'feature', 'general', 'other').required(),
  message: Joi.string().trim().min(5).max(3000).required(),
  email: Joi.string().email().optional().allow(null, ''),
  contactConsent: Joi.boolean().default(false)
});

export const feedbackIdParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const getFeedbacksSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});