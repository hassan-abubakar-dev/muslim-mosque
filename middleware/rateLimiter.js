import rateLimit from 'express-rate-limit';

// Factory function to create limiters easily
const createLimiter = (maxRequests, windowMinutes, message) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000, // Convert minutes to milliseconds
        max: maxRequests,
        message: { status: 'fail', message },
        standardHeaders: true, 
        legacyHeaders: false,
    });
};

// 1. Auth Limiter: 10 attempts per 15 minutes
// Balanced for login/register retries due to connection timeouts
export const authLimiter = createLimiter(
    10, 
    15, 
    'Too many login or registration attempts. Please try again after 15 minutes.'
);

// 2. Password Reset Limiter: 5 attempts per 15 minutes
// Stricter for sensitive actions like forgot-password/reset-password
export const passwordResetLimiter = createLimiter(
    5, 
    15, 
    'Too many reset requests. Please wait 15 minutes for your email to arrive.'
);

export const forgotPasswordLimiter = createLimiter(
    3, // Only 3 chances to request a reset
    15,
    'Too many reset requests. Please wait 15 minutes.'
);

export const verifyCodeLimiter = createLimiter(
    10, // 10 chances to verify a code
    15,
    'Too many verification attempts. Please wait 15 minutes.'
);

// 3. API Limiter: 100 requests per 15 minutes
// Standard limit for general data fetching
export const apiLimiter = createLimiter(
    2000, 
    15, 
    'Too many requests from this IP. Please try again later.'
);


