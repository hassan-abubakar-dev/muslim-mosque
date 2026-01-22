import {
  createMosqueSchema,
  updateMosqueSchema,
  getMosquesSchema,
  getMosqueByIdSchema,
  updateMosqueStatusSchema
} from '../validation/mosqueValidation.js';

const validateCreateMosque = (req, res, next) => {
  const { error, value } = createMosqueSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedData = value;
  next();
};

const validateUpdateMosque = (req, res, next) => {
  const { error, value } = updateMosqueSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedData = value;
  next();
};

const validateGetMosques = (req, res, next) => {
  // Validate query parameters
  const { error, value } = getMosquesSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedQuery = value;
  next();
};

const validateGetMosqueById = (req, res, next) => {
  const { error, value } = getMosqueByIdSchema.validate(req.params);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedParams = value;
  next();
};

const validateUpdateMosqueStatus = (req, res, next) => {
  const { error, value } = updateMosqueStatusSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  req.validatedData = value;
  next();
};

export {
  validateCreateMosque,
  validateUpdateMosque,
  validateGetMosques,
  validateGetMosqueById,
  validateUpdateMosqueStatus
};