import Joi from 'joi';

export const registerMosqueValidationSchema = Joi.object({
    name: Joi.string()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Mosque name is required',
            'string.min': 'Mosque name must be at least 3 characters',
            'string.max': 'Mosque name must be less than 100 characters'
        }),

    country: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Country is required'
        }),

    state: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'State is required'
        }),

    localGovernment: Joi.string()
        .min(3)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Local government is required'
        }),

    description: Joi.string()
        .max(1000)
        .allow(null, '')
        .messages({
            'string.max': 'Description cannot be longer than 1000 characters'
        }),

    status: Joi.string()
        .valid('pending', 'verified', 'rejected')
        .default('pending')
        .messages({
            'any.only': 'Status must be one of pending, verified, or rejected'
        })
});
