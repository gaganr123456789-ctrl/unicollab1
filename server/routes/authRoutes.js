import express from 'express';
import { signup, login, ssoLogin, forgotPassword, verifyOtp, resetPassword, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public Authentication Routes
router.post('/signup', signup);
router.post('/register', signup); // Alias for compatibility
router.post('/login', login);
router.post('/sso', ssoLogin);

// Forgot Password & Resend OTP Flow Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Protected Authentication Route
router.get('/me', authenticateToken, getMe);

export default router;
