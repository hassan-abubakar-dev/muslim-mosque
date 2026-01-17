import Joi from 'joi';

// Register new user validation schema
export const registerValidationSchema = Joi.object({
  firstName: Joi.string()
    .min(3)
    .max(35)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 3 characters',
      'string.max': 'First name cannot exceed 35 characters',
    }),
  
  surName: Joi.string()
    .min(3)
    .max(35)
    .required()
    .messages({
      'string.empty': 'Surname is required',
      'string.min': 'Surname must be at least 3 characters',
      'string.max': 'Surname cannot exceed 35 characters',
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 100 characters'
    }),
  
  gender: Joi.string()
    .valid('male', 'female')
    .required()
    .messages({
      'any.only': 'Gender must be either "male" or "female"',
      'string.empty': 'Gender is required',
    }),
});

// Login validation schema
export const loginValidationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
    }),
});

// Verification code validation schema
export const verificationValidationSchema = Joi.object({
  verificationCode: Joi.string()
    .length(6)
    .required()
    .messages({
      'string.empty': 'Verification code is required',
      'string.length': 'Verification code must be exactly 6 characters',
    }),
});
