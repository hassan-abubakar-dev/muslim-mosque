import Joi from 'joi';

export const uploadSchema = Joi.object({
  fileName: Joi.string().required(),
  fileType: Joi.string().required(),
  fileSize: Joi.number().max(100 * 1024 * 1024).required(), // 100MB limit
});