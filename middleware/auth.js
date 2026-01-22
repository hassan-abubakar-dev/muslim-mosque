import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import AppError from '../utils/AppError.js';

// Protect routes
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);

            // Get user from the token
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            next();
        } catch (error) {
            console.error(error);
            return next(new AppError('Not authorized to access this route', 401));
        }
    }

    if (!token) {
        return next(new AppError('Not authorized, no token', 401));
    }
};

// Grant access to specific roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('User role not authorized to access this route', 403)
            );
        }
        next();
    };
};