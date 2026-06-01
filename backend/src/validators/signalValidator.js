const { z } = require('zod');

// Schema for signal creation
const createSignalSchema = z.object({
  body: z.object({
    assetSymbol: z.string({
      required_error: 'Asset symbol is required',
    }).min(1, 'Asset symbol must not be empty')
      .regex(/^[A-Z0-9]+$/, 'Asset symbol must contain only uppercase alphanumeric characters (e.g. BTC, ETH)'),
    
    signalType: z.enum(['BUY', 'SELL'], {
      errorMap: () => ({ message: 'Signal type must be either BUY or SELL' }),
    }),
    
    entryPrice: z.coerce.number({
      required_error: 'Entry price is required',
      invalid_type_error: 'Entry price must be a number',
    }).positive('Entry price must be a positive number'),
    
    targetPrice: z.coerce.number({
      required_error: 'Target price is required',
      invalid_type_error: 'Target price must be a number',
    }).positive('Target price must be a positive number'),
    
    stopLoss: z.coerce.number({
      required_error: 'Stop loss is required',
      invalid_type_error: 'Stop loss must be a number',
    }).positive('Stop loss must be a positive number'),
    
    notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
    
    status: z.enum(['OPEN', 'CLOSED']).default('OPEN').optional(),
  }),
});

// Schema for signal updating
const updateSignalSchema = z.object({
  body: z.object({
    assetSymbol: z.string()
      .min(1, 'Asset symbol must not be empty')
      .regex(/^[A-Z0-9]+$/, 'Asset symbol must contain only uppercase alphanumeric characters')
      .optional(),
    
    signalType: z.enum(['BUY', 'SELL']).optional(),
    
    entryPrice: z.coerce.number().positive('Entry price must be a positive number').optional(),
    
    targetPrice: z.coerce.number().positive('Target price must be a positive number').optional(),
    
    stopLoss: z.coerce.number().positive('Stop loss must be a positive number').optional(),
    
    notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
    
    status: z.enum(['OPEN', 'CLOSED']).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid signal ID format. Must be a valid UUID.'),
  }),
});

// Schema to validate signal ID route parameters
const signalIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid signal ID format. Must be a valid UUID.'),
  }),
});

// Schema for live price queries
const livePriceParamSchema = z.object({
  params: z.object({
    symbol: z.string({
      required_error: 'Asset symbol is required',
    }).min(1, 'Asset symbol must not be empty')
      .regex(/^[A-Za-z0-9]+$/, 'Asset symbol must contain only alphanumeric characters'),
  }),
});

module.exports = {
  createSignalSchema,
  updateSignalSchema,
  signalIdParamSchema,
  livePriceParamSchema,
};
