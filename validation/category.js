import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required'
  }),
  teacherName: Joi.string().trim().required().messages({
    'string.empty': 'Teacher name is required',
    'any.required': 'Teacher name is required'
  }),
  information: Joi.string().trim().optional().allow('').messages({
    'string.base': 'Information must be a string'
  })
});
