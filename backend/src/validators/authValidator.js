const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'Name is required',
    }).min(2, 'Name must be at least 2 characters long').max(50, 'Name must not exceed 50 characters'),
    
    email: z.string({
      required_error: 'Email is required',
    }).email('Invalid email address format'),
    
    password: z.string({
      required_error: 'Password is required',
    }).min(6, 'Password must be at least 6 characters long')
      .max(100, 'Password must not exceed 100 characters'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: 'Email is required',
    }).email('Invalid email address format'),
    
    password: z.string({
      required_error: 'Password is required',
    }).min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string({
      required_error: 'Refresh token is required',
    }).min(1, 'Refresh token must not be empty'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
};
