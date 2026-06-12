import Joi from 'joi';

export const createReportParamsSchema = Joi.object({
  mosqueId: Joi.string().uuid().required()
});

export const createReportBodySchema = Joi.object({
  reasonCategory: Joi.string()
    .valid('fake_account', 'unislamic_media', 'wrong_location', 'inappropriate_info', 'other')
    .required(),
  customReason: Joi.string().allow('').optional(),
  mosqueName: Joi.string().required()
});

export const getReportsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(5)
});

export const reportIdParamsSchema = Joi.object({
  id: Joi.string().uuid().required()
});