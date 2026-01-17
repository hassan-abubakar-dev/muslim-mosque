
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
        });
        
        if(error) {
            const errorMessages = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({
                status: 'fail',
                message: errorMessages,
            });
        }
        
        next();
    }
}

export default validate;
