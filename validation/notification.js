import Joi from 'joi';

export const getNotificationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(15)
});

// Used if you decide to expose the POST endpoint
export const createNotificationSchema = Joi.object({
  mosqueId: Joi.string().uuid().required(),
  message: Joi.string().min(3).required(),
  type: Joi.string().valid('announcement', 'lecture', 'general').required(),
  announcementId: Joi.string().uuid().optional(),
  lectureId: Joi.string().uuid().optional()
});