import Joi from 'joi';

export const teamRosterParamsSchema = Joi.object({
  mosqueId: Joi.string().uuid().required()
});

export const adminAssistantBodySchema = Joi.object({
  mosqueId: Joi.string().uuid().required(),
  targetUserId: Joi.string().uuid().required()
});

export const removeAssistantQuerySchema = Joi.object({
  mosqueId: Joi.string().uuid().required(),
  targetUserId: Joi.string().uuid().required()
});