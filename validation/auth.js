import Joi from 'joi';

// Register new user validation schema
export const registerValidationSchema = Joi.object({
  firstName: Joi.string()
  .trim()
    .min(3)
    .max(35)
    .required()
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.pattern.base': 'First name can only contain letters',
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 3 characters',
      'string.max': 'First name cannot exceed 35 characters',
    }),
  
  surName: Joi.string()
  .trim()
    .min(3)
    .max(35)
    .required()
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.pattern.base': 'Surname name can only contain letters',
      'string.empty': 'Surname is required',
      'string.min': 'Surname must be at least 3 characters',
      'string.max': 'Surname cannot exceed 35 characters',
    }),
  
  email: Joi.string()
  .trim()
    .email()
    .required()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .max(100)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
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
  .trim()
    .email()
    .required()
    .lowercase()
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

export const emailValidationSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required()
});

export const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.pattern.base': 'New password must contain at least one uppercase, one lowercase, one number, and one special character',
    }),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number, and one special character',
    }),
  token: Joi.string()
    .required()
    .messages({
      'string.empty': 'Reset token is required',
    }),
});


