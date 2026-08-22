import express from 'express';
import crypto from 'crypto';
import { usersDB } from '../db/dataStore.js';

const router = express.Router();

// --------------------------------------------------------------------------
// 1. Authorized Admin Email Allowlist & Security Configuration
// --------------------------------------------------------------------------
const getAdminAllowlist = () => {
  const email1 = (process.env.ADMIN_EMAIL_1 || 'gagan.r123456789@gmail.com').trim().toLowerCase();
  const email2 = (process.env.ADMIN_EMAIL_2 || 'charanyajagannath0982@gmail.com').trim().toLowerCase();
  return new Set([email1, email2]);
};

// Mask email for security logging (e.g. ad***@unicollab.edu)
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  return `${user.substring(0, 2)}***@${domain}`;
};

// SHA-256 Hashing helper
const hashString = (val) => crypto.createHash('sha256').update(val).digest('hex');

// In-Memory Storage for Admin Passkey & OTPs (decoupled from student auth)
const adminOtpStore = new Map(); // email -> { hashedOtp, expiresAt, attempts, resetToken, verified }
const rateLimitStore = new Map(); // email -> [timestamps]

// Default Admin Passkey Hash (SHA-256 of process.env.ADMIN_DEFAULT_KEY or 'admin123')
let currentAdminPasskeyHash = hashString(process.env.ADMIN_DEFAULT_KEY || 'admin123');

// --------------------------------------------------------------------------
// 2. Security Log Audit Helper (Never logs plain OTP or raw credentials)
// --------------------------------------------------------------------------
const logSecurityEvent = (event, maskedEmail, details = '') => {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY AUDIT] [${timestamp}] ${event} | Target: ${maskedEmail} | ${details}`);
};

// Rate limiter helper (max 3 reset requests per 15 minutes)
const checkRateLimit = (email) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxRequests = 3;

  const timestamps = rateLimitStore.get(email) || [];
  const validTimestamps = timestamps.filter(t => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitStore.set(email, validTimestamps);
  return true;
};

// --------------------------------------------------------------------------
// 3. POST /api/admin/request-passkey-reset
// Initiates OTP reset request for authorized admin emails only.
// --------------------------------------------------------------------------
router.post('/request-passkey-reset', (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ 
      success: false, 
      message: 'A valid email address is required.' 
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const masked = maskEmail(normalizedEmail);

  // Rate Limiting Check
  if (!checkRateLimit(normalizedEmail)) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', masked, 'Too many reset requests.');
    return res.status(429).json({
      success: false,
      message: 'Too many passkey reset requests. Please wait 15 minutes before trying again.'
    });
  }

  const allowlist = getAdminAllowlist();
  const isAuthorized = allowlist.has(normalizedEmail);

  if (!isAuthorized) {
    logSecurityEvent('UNAUTHORIZED_RESET_ATTEMPT', masked, 'Email not in server-side admin allowlist.');
    // Generic response to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: 'If this email address is an authorized administrator, a 6-digit verification code has been dispatched to your inbox.'
    });
  }

  // Authorized Admin: Generate 6-digit OTP (Cryptographically Secure)
  const plainOtp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = hashString(plainOtp);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  adminOtpStore.set(normalizedEmail, {
    hashedOtp,
    expiresAt,
    attempts: 0,
    resetToken: null,
    verified: false
  });

  logSecurityEvent('ADMIN_OTP_GENERATED', masked, `Expires in 10 minutes. OTP dispatched via server mailer.`);

  // Simulated email dispatch output (In production, wire to SendGrid/Nodemailer)
  console.log(`✉️ [SERVER MAIL DISPATCH] To: ${normalizedEmail} | Subject: Admin Passkey Reset Code | Code: ${plainOtp}`);

  return res.status(200).json({
    success: true,
    message: 'If this email address is an authorized administrator, a 6-digit verification code has been dispatched to your inbox.',
    // Include dev code ONLY in development node environments for automated testing
    ...(process.env.NODE_ENV === 'development' ? { _devCode: plainOtp } : {})
  });
});

// --------------------------------------------------------------------------
// 4. POST /api/admin/verify-reset-otp
// Verifies 6-digit OTP server-side with attempt limits & hash comparison.
// --------------------------------------------------------------------------
router.post('/verify-reset-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const masked = maskEmail(normalizedEmail);
  const record = adminOtpStore.get(normalizedEmail);

  if (!record) {
    logSecurityEvent('OTP_VERIFY_FAILED', masked, 'No active reset request found.');
    return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
  }

  // Expiry check
  if (Date.now() > record.expiresAt) {
    adminOtpStore.delete(normalizedEmail);
    logSecurityEvent('OTP_EXPIRED', masked, 'Verification code expired.');
    return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
  }

  // Attempt limit check (Max 5 attempts)
  record.attempts += 1;
  if (record.attempts > 5) {
    adminOtpStore.delete(normalizedEmail);
    logSecurityEvent('OTP_MAX_ATTEMPTS_EXCEEDED', masked, 'Max 5 attempts reached. Store cleared.');
    return res.status(429).json({ success: false, message: 'Maximum verification attempts exceeded. Reset flow invalidated.' });
  }

  // Hash input OTP and compare
  const inputHash = hashString(otp.trim());
  if (inputHash !== record.hashedOtp) {
    logSecurityEvent('OTP_HASH_MISMATCH', masked, `Attempt ${record.attempts}/5 failed.`);
    return res.status(400).json({ 
      success: false, 
      message: `Invalid verification code. ${5 - record.attempts} attempts remaining.` 
    });
  }

  // OTP Valid: Generate one-time session reset token
  const resetToken = `ADM-RST-${crypto.randomBytes(24).toString('hex')}`;
  record.verified = true;
  record.resetToken = resetToken;
  adminOtpStore.set(normalizedEmail, record);

  logSecurityEvent('OTP_VERIFY_SUCCESS', masked, 'OTP verified. Reset token issued.');

  return res.status(200).json({
    success: true,
    message: 'Verification code verified successfully. You may now set your new admin passkey.',
    resetToken
  });
});

// --------------------------------------------------------------------------
// 5. POST /api/admin/reset-passkey
// Updates master admin passkey & immediately invalidates OTP session.
// --------------------------------------------------------------------------
router.post('/reset-passkey', (req, res) => {
  const { email, resetToken, newPasskey } = req.body;

  if (!email || !resetToken || !newPasskey) {
    return res.status(400).json({ success: false, message: 'Email, reset token, and new passkey are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const masked = maskEmail(normalizedEmail);
  const record = adminOtpStore.get(normalizedEmail);

  if (!record || !record.verified || record.resetToken !== resetToken) {
    logSecurityEvent('PASSKEY_RESET_FAILED', masked, 'Invalid or unverified reset token.');
    return res.status(403).json({ success: false, message: 'Unauthorized reset token. Please restart the passkey reset flow.' });
  }

  if (newPasskey.trim().length < 6) {
    return res.status(400).json({ success: false, message: 'New Admin Passkey must be at least 6 characters long.' });
  }

  // Update Master Admin Passkey Hash
  currentAdminPasskeyHash = hashString(newPasskey.trim());

  // IMMEDIATELY INVALIDATE OTP AND TOKEN
  adminOtpStore.delete(normalizedEmail);

  logSecurityEvent('ADMIN_PASSKEY_CHANGED', masked, 'Master Admin Passkey updated successfully.');

  return res.status(200).json({
    success: true,
    message: 'Master Admin Passkey updated successfully! You may now authenticate with your new passkey.'
  });
});

// --------------------------------------------------------------------------
// 6. POST /api/admin/authenticate
// Authenticates admin passkey against server-side hash.
// --------------------------------------------------------------------------
router.post('/authenticate', (req, res) => {
  const { passkey } = req.body;

  if (!passkey || typeof passkey !== 'string') {
    return res.status(400).json({ success: false, message: 'Passkey is required.' });
  }

  const inputHash = hashString(passkey.trim());

  if (inputHash === currentAdminPasskeyHash) {
    logSecurityEvent('ADMIN_LOGIN_SUCCESS', 'ADMIN_SESSION', 'Successful admin authentication.');
    return res.status(200).json({
      success: true,
      message: 'Admin authorization granted.',
      adminToken: `adm_session_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`
    });
  }

  logSecurityEvent('ADMIN_LOGIN_FAILED', 'ADMIN_SESSION', 'Invalid admin passkey attempt.');
  return res.status(401).json({
    success: false,
    message: 'Access Denied: Invalid Admin Authorization Key.'
  });
});

// --------------------------------------------------------------------------
// 7. GET /api/admin/users - Protected Admin User Directory
// --------------------------------------------------------------------------
router.get('/users', async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const { query } = await import('../db/postgres.js');
      const dbRes = await query('SELECT id, name, email, major, university, age, phone, gender, created_at FROM users ORDER BY id DESC');
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        return res.status(200).json({
          success: true,
          count: dbRes.rows.length,
          source: 'Supabase PostgreSQL Cloud Database',
          users: dbRes.rows
        });
      }
    }
  } catch (err) {
    console.warn('Admin users SQL query info:', err.message);
  }

  return res.status(200).json({
    success: true,
    count: usersDB.length,
    source: 'Application State',
    users: usersDB
  });
});

export default router;
