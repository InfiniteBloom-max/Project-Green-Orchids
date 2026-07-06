const { z } = require('zod');

// Trim + lowercase BEFORE the .email() format check so " Foo@Example.com " (trailing
// whitespace / mixed case) validates and normalizes cleanly instead of being rejected
// or causing a lookup mismatch downstream.
const emailField = z.string().trim().toLowerCase().email();

const registerSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().trim().min(2).max(100),
  business_name: z.string().trim().min(2).max(200),
  business_reg_no: z.string().optional(),
  phone: z.string().trim().min(7).max(20),
  address_line1: z.string().trim().min(3).max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  district: z.string().optional(),
  postal_code: z.string().max(20).optional(),
}).strict();

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
}).strict();

const forgotPasswordSchema = z.object({
  email: emailField,
}).strict();

const verifyOtpSchema = z.object({
  email: emailField,
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
}).strict();

const resendOtpSchema = z.object({
  email: emailField,
}).strict();

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(10)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(10)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
}).strict();

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  business_name: z.string().trim().min(2).max(200).optional(),
  address_line1: z.string().trim().min(3).max(200).optional(),
  address_line2: z.string().max(200).optional(),
  city: z.string().trim().min(2).max(100).optional(),
  district: z.string().optional(),
  postal_code: z.string().max(20).optional(),
}).strict();

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyOtpSchema,
  resendOtpSchema,
};
