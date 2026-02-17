import Joi from "joi";

export const createUploadLectureSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': 'Lecture title is not empty',
    'any.required': 'Lecture title is required'
  })
}).unknown(true);