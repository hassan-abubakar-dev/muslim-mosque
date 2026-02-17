import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Category name is not empty',
    'any.required': 'Category name is required'
  }),
  teacherName: Joi.string().trim().required().messages({
    'string.empty': 'Teacher name is not empty',
    'any.required': 'Teacher name is required'
  }),
  information: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Information must be a string'
  })
}).unknown(true); 


export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    'string.base': 'Category name must be a string'
  }),

  teacherName: Joi.string().trim().optional().messages({
    'string.base': 'Teacher name must be a string'
  }),

  information: Joi.optional().allow('').messages({
    'string.base': 'Information must be a string'
  })
})
.min(1)
.messages({
  'object.min': 'At least one field must be provided for update'
}).unknown(true);
