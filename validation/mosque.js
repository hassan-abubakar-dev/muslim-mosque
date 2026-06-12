import Joi from 'joi';

export const registerMosqueValidationSchema = Joi.object({
    name: Joi.string()
    .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Mosque name is required',
            'string.min': 'Mosque name must be at least 3 characters',
            'string.max': 'Mosque name must be less than 100 characters'
        }),

    country: Joi.string()
    .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Country is required'
        }),

    state: Joi.string()
    .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'State is required'
        }),

    localGovernment: Joi.string()
    .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Local government is required'
        }),

    description: Joi.string()
    .trim()
        .max(1000)
        .allow(null, '')
        .messages({
            'string.max': 'Description cannot be longer than 1000 characters'
        }),

    status: Joi.string()

        .valid('pending', 'verified', 'suspended')
        .default('pending')
        .messages({
            'any.only': 'Status must be one of pending, verified, or suspended'
        })
});

export const mosqueIdParamSchema = Joi.object({
  mosqueId: Joi.string().uuid().required()
});

export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

export const getMosquesQuerySchema = Joi.object({
  search: Joi.string().trim().allow(''),
  state: Joi.string().trim().allow(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10)
});
