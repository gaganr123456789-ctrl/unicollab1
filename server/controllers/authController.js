import bcrypt from 'bcryptjs';
import { usersDB } from '../db/dataStore.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { sendEmail, generateOtpEmailHtml } from '../../utils/email.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in authController.');
      return null;
    }
  }
  return prismaInstance;
};

// Rate limiter map for forgot password: max 5 requests per email per hour
const forgotPasswordTracker = new Map();
const checkForgotPasswordRateLimit = (email) => {
  const now = Date.now();
  const attempts = forgotPasswordTracker.get(email) || [];
  const recent = attempts.filter(t => now - t < 60 * 60 * 1000);
  if (recent.length >= 5) return false;
  recent.push(now);
  forgotPasswordTracker.set(email, recent);
  return true;
};

// PUT /auth/profile - Update user profile across database & platforms
export const updateProfile = async (req, res) => {
  const { email, name, age, phone, gender, major, degree, university, bio, skills, avatarUrl, linkedIn, linkedin, website, github, twitter } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'User email is required to update profile.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const updated = await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          ...(name && { name }),
          ...(age && { age: String(age) }),
          ...(phone && { phone }),
          ...(gender && { gender }),
          ...(major && { major }),
          ...(degree && { degree }),
          ...(university && { university }),
          ...(bio !== undefined && { bio }),
          ...((linkedIn || linkedin) && { linkedIn: linkedIn || linkedin }),
          ...(skills && Array.isArray(skills) && { skills }),
          ...(avatarUrl && { avatarUrl })
        }
      });
      return res.status(200).json({ success: true, message: 'Profile updated successfully.', user: updated });
    }
  } catch (err) {
    console.warn('Prisma profile update warning:', err.message);
  }

  // Fallback in-memory update
  const storeUserIdx = usersDB.findIndex(u => u.email.toLowerCase() === normalizedEmail);
  if (storeUserIdx >= 0) {
    usersDB[storeUserIdx] = {
      ...usersDB[storeUserIdx],
      ...req.body,
      name: name || usersDB[storeUserIdx].name,
      major: major || usersDB[storeUserIdx].major,
      degree: degree || usersDB[storeUserIdx].degree,
      bio: bio !== undefined ? bio : usersDB[storeUserIdx].bio,
      website: website !== undefined ? website : usersDB[storeUserIdx].website,
      github: github !== undefined ? github : usersDB[storeUserIdx].github,
      linkedIn: (linkedIn || linkedin) || usersDB[storeUserIdx].linkedIn,
      twitter: twitter !== undefined ? twitter : usersDB[storeUserIdx].twitter
    };
    return res.status(200).json({ success: true, message: 'Profile updated in session.', user: usersDB[storeUserIdx] });
  }

  return res.status(200).json({ success: true, message: 'Profile updated successfully.', user: req.body });
};

// POST /auth/signup
export const signup = async (req, res) => {
  const { 
    name, fullName, email, password, role = 'STUDENT',
    university, major, degree, experience, projectFocus, currentProject, nextProject, skills,
    roleTitle, mentorInterests, linkedIn, age, phone, gender 
  } = req.body;

  const userRole = (role || 'STUDENT').toUpperCase() === 'MENTOR' ? 'MENTOR' : 'STUDENT';
  const userName = (name || fullName || '').trim();

  if (!userName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required fields.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const parsedSkills = Array.isArray(skills) ? skills : (skills ? String(skills).split(',').map(s => s.trim()) : ['Engineering']);
  const parsedInterests = Array.isArray(mentorInterests) ? mentorInterests : (mentorInterests ? String(mentorInterests).split(',').map(s => s.trim()) : ['Web Dev', 'AI/ML']);

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const branchFromDegree = degree ? String(degree).replace(/^B\.Tech\s+|^B\.Sc\s+|^M\.Tech\s+\/\s+M\.S\.\s+/i, '').trim() : '';
      const userMajor = major || branchFromDegree || (userRole === 'MENTOR' ? 'Mentorship & Research' : 'Computer Science & Engineering (CSE)');
      const userDegree = userRole === 'MENTOR' ? (degree || 'Mentor Advisor') : (degree || `B.Tech ${userMajor}`);
      const userRoleTitle = userRole === 'MENTOR' ? (roleTitle || 'Industry Professional') : 'Student';

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          name: userName,
          email: normalizedEmail,
          password: hashedPassword,
          role: userRole,
          university: university || (userRole === 'MENTOR' ? 'University Faculty / Industry' : 'Stanford University'),
          major: userMajor,
          degree: userDegree,
          experience: experience || '',
          projectFocus: projectFocus || 'Web Dev',
          currentProject: currentProject || '',
          nextProject: nextProject || '',
          roleTitle: userRoleTitle,
          mentorInterests: parsedInterests,
          linkedIn: linkedIn || '',
          avatarBg: userRole === 'MENTOR' ? '#7C3AED' : '#2563EB',
          skills: parsedSkills
        }
      });

      const token = generateToken({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role });
      const { password: _, ...userWithoutPassword } = newUser;

      // Broadcast Socket.io event for real-time Admin Portal update
      try {
        const io = req.app?.get('io') || global.io;
        if (io) {
          io.to('admin_room').emit('admin:newUser', userWithoutPassword);
          io.emit('admin:newUser', userWithoutPassword);
        }
      } catch (e) {
        console.warn('Socket broadcast warning:', e);
      }

      return res.status(201).json({
        success: true,
        message: `${userRole === 'MENTOR' ? 'Mentor' : 'Student'} account created successfully.`,
        token,
        user: userWithoutPassword
      });
    }
  } catch (err) {
    console.warn('Prisma signup error, falling back to dataStore:', err.message);
  }

  // DataStore Fallback
  const existingStoreUser = usersDB.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingStoreUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const branchFromDegree = degree ? String(degree).replace(/^B\.Tech\s+|^B\.Sc\s+|^M\.Tech\s+\/\s+M\.S\.\s+/i, '').trim() : '';
  const userMajor = major || branchFromDegree || (userRole === 'MENTOR' ? 'Mentorship & Research' : 'Computer Science & Engineering (CSE)');
  const userDegree = userRole === 'MENTOR' ? (degree || 'Mentor Advisor') : (degree || `B.Tech ${userMajor}`);
  const userRoleTitle = userRole === 'MENTOR' ? (roleTitle || 'Industry Professional') : 'Student';

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: `usr_${Date.now()}`,
    name: userName,
    email: normalizedEmail,
    password: hashedPassword,
    role: userRole,
    university: university || (userRole === 'MENTOR' ? 'University Faculty / Industry' : 'Stanford University'),
    major: userMajor,
    degree: userDegree,
    experience: experience || '',
    projectFocus: projectFocus || 'Web Dev',
    currentProject: currentProject || '',
    nextProject: nextProject || '',
    roleTitle: userRoleTitle,
    mentorInterests: parsedInterests,
    linkedIn: linkedIn || '',
    skills: parsedSkills,
    age: age || 21,
    phone: phone || '',
    gender: gender || (userRole === 'MENTOR' ? 'Mentor' : 'Student'),
    avatarBg: userRole === 'MENTOR' ? '#7C3AED' : '#2563EB',
    createdAt: new Date().toISOString(),
    created: new Date().toISOString()
  };

  usersDB.unshift(newUser);
  const token = generateToken({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role });
  const { password: _, ...userPayload } = newUser;

  // Broadcast Socket.io event for real-time Admin Portal update
  try {
    const io = req.app?.get('io') || global.io;
    if (io) {
      io.to('admin_room').emit('admin:newUser', userPayload);
      io.emit('admin:newUser', userPayload);
    }
  } catch (e) {
    console.warn('Socket broadcast warning:', e);
  }

  return res.status(201).json({
    success: true,
    message: `${userRole === 'MENTOR' ? 'Mentor' : 'Student'} account created successfully.`,
    token,
    user: userPayload
  });
};

// POST /auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Academic email and password are required.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const prisma = await getPrisma();
    if (prisma) {
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'No registered account found with this email. Please Sign Up first.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
      }

      const token = generateToken({ id: user.id, email: user.email, name: user.name });
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: userWithoutPassword
      });
    }
  } catch (err) {
    console.warn('Prisma login error, falling back to dataStore:', err.message);
  }

  // DataStore Fallback
  const storeUser = usersDB.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!storeUser) {
    return res.status(404).json({ success: false, message: 'No registered account found with this email.' });
  }

  const isPasswordValid = storeUser.password.startsWith('$2b$') || storeUser.password.startsWith('$2a$')
    ? await bcrypt.compare(password, storeUser.password)
    : password === storeUser.password;

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
  }

  const token = generateToken({ id: storeUser.id, email: storeUser.email, name: storeUser.name });
  const { password: _, ...userPayload } = storeUser;

  return res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    token,
    user: userPayload
  });
};

// POST /auth/sso
export const ssoLogin = async (req, res) => {
  const { provider = 'google', email, name } = req.body;
  const ssoEmail = (email || `student.${provider}@stanford.edu`).trim().toLowerCase();
  const ssoName = name || (provider === 'github' ? 'Alex Rivera (GitHub)' : 'Alex Rivera (Google)');

  try {
    const prisma = await getPrisma();
    if (prisma) {
      let user = await prisma.user.findUnique({ where: { email: ssoEmail } });
      if (!user) {
        const dummyPassword = await bcrypt.hash(`sso_${provider}_${Date.now()}`, 10);
        user = await prisma.user.create({
          data: {
            name: ssoName,
            email: ssoEmail,
            password: dummyPassword,
            university: 'Stanford University',
            major: 'Computer Science & Engineering (CSE)',
            avatarBg: provider === 'github' ? '#181717' : '#4285F4'
          }
        });
      }

      const token = generateToken({ id: user.id, email: user.email, name: user.name });
      const { password: _, ...userPayload } = user;
      return res.status(200).json({
        success: true,
        message: `Single Sign-On success via ${provider.toUpperCase()}!`,
        token,
        user: { ...userPayload, provider }
      });
    }
  } catch (err) {
    console.warn('Prisma SSO fallback:', err.message);
  }

  let storeUser = usersDB.find(u => u.email.toLowerCase() === ssoEmail);
  if (!storeUser) {
    storeUser = {
      id: `sso_${provider}_${Date.now()}`,
      name: ssoName,
      email: ssoEmail,
      password: 'sso_authenticated',
      university: 'Stanford University',
      major: 'Computer Science & Engineering (CSE)',
      avatarBg: provider === 'github' ? '#181717' : '#4285F4',
      provider
    };
    usersDB.push(storeUser);
  }

  const token = generateToken({ id: storeUser.id, email: storeUser.email, name: storeUser.name });
  const { password: _, ...userPayload } = storeUser;

  return res.status(200).json({
    success: true,
    message: `Single Sign-On success via ${provider.toUpperCase()}!`,
    token,
    user: { ...userPayload, provider }
  });
};

// POST /auth/forgot-password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Academic email address is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check Rate Limit (Max 5 requests per email per hour)
  if (!checkForgotPasswordRateLimit(normalizedEmail)) {
    return res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please wait 1 hour before trying again.'
    });
  }

  // 2. Generate 6-Digit OTP Code & 10-Minute Expiry
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 3. Save OTP to DB / DataStore
  let userFound = false;
  let userName = 'Student';
  try {
    const prisma = await getPrisma();
    if (prisma) {
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (user) {
        userFound = true;
        userName = user.name;
        await prisma.user.update({
          where: { id: user.id },
          data: { otpCode, otpExpiresAt }
        });
      }
    }
  } catch (err) {
    console.warn('Prisma forgotPassword update fallback:', err.message);
  }

  if (!userFound) {
    const storeUser = usersDB.find(u => u.email.toLowerCase() === normalizedEmail);
    if (storeUser) {
      userFound = true;
      userName = storeUser.name;
      storeUser.otpCode = otpCode;
      storeUser.otpExpiresAt = otpExpiresAt;
    }
  }

  if (!userFound) {
    return res.status(404).json({
      success: false,
      message: 'No registered student account found with this email.'
    });
  }

  // 4. Dispatch Email via Resend SDK
  const htmlContent = generateOtpEmailHtml(otpCode, userName);
  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: 'Your UniCollab password reset code',
    html: htmlContent
  });

  // 5. CRITICAL: Only respond "code sent" if Resend actually confirms success!
  if (!emailResult.success) {
    return res.status(500).json({
      success: false,
      message: emailResult.error?.message || 'Failed to dispatch verification email via Resend API.',
      error: emailResult.error
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Verification code sent! Please check your email inbox.',
    email: normalizedEmail,
    resendId: emailResult.id
  });
};

// POST /auth/verify-otp
export const verifyOtp = async (req, res) => {
  const { email, otpCode } = req.body;
  if (!email || !otpCode) {
    return res.status(400).json({ success: false, message: 'Email and 6-digit verification code are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const inputCode = otpCode.trim();

  let userRecord = null;
  try {
    const prisma = await getPrisma();
    if (prisma) {
      userRecord = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    }
  } catch (err) {}

  if (!userRecord) {
    userRecord = usersDB.find(u => u.email.toLowerCase() === normalizedEmail);
  }

  if (!userRecord) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  if (!userRecord.otpCode || userRecord.otpCode !== inputCode) {
    return res.status(400).json({ success: false, message: 'Invalid 6-digit verification code.' });
  }

  if (userRecord.otpExpiresAt && new Date(userRecord.otpExpiresAt) < new Date()) {
    return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
  }

  return res.status(200).json({
    success: true,
    message: 'Verification code confirmed successfully.',
    verified: true
  });
};

// POST /auth/reset-password
export const resetPassword = async (req, res) => {
  const { email, otpCode, newPassword } = req.body;
  if (!email || !otpCode || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, verification code, and new password are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const inputCode = otpCode.trim();

  // Re-verify OTP
  let userRecord = null;
  try {
    const prisma = await getPrisma();
    if (prisma) {
      userRecord = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    }
  } catch (err) {}

  if (!userRecord) {
    userRecord = usersDB.find(u => u.email.toLowerCase() === normalizedEmail);
  }

  if (!userRecord || !userRecord.otpCode || userRecord.otpCode !== inputCode) {
    return res.status(400).json({ success: false, message: 'Invalid or expired verification code.' });
  }

  if (userRecord.otpExpiresAt && new Date(userRecord.otpExpiresAt) < new Date()) {
    return res.status(400).json({ success: false, message: 'Verification code has expired.' });
  }

  // Hash new password with bcrypt (10 rounds)
  const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

  // Update User & Clear OTP fields
  try {
    const prisma = await getPrisma();
    if (prisma && userRecord.id) {
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          password: hashedPassword,
          otpCode: null,
          otpExpiresAt: null
        }
      });
    }
  } catch (err) {
    console.warn('Prisma resetPassword update fallback:', err.message);
  }

  const storeUser = usersDB.find(u => u.email.toLowerCase() === normalizedEmail);
  if (storeUser) {
    storeUser.password = hashedPassword;
    storeUser.otpCode = null;
    storeUser.otpExpiresAt = null;
  }

  return res.status(200).json({
    success: true,
    message: 'Password updated successfully! You can now log in with your new password.'
  });
};

// GET /auth/me
export const getMe = async (req, res) => {
  const userId = req.user?.id;
  const userEmail = req.user?.email;

  try {
    const prisma = await getPrisma();
    if (prisma && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const { password: _, ...userPayload } = user;
        return res.status(200).json({ success: true, user: userPayload });
      }
    }
  } catch (err) {
    console.warn('Prisma getMe fallback:', err.message);
  }

  const storeUser = usersDB.find(u => u.email.toLowerCase() === (userEmail || '').toLowerCase());
  if (storeUser) {
    const { password: _, ...userPayload } = storeUser;
    return res.status(200).json({ success: true, user: userPayload });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: userId || 'usr_demo',
      name: req.user?.name || 'Alex Rivera',
      email: userEmail || 'alex@stanford.edu',
      university: 'Stanford University',
      major: 'Computer Science & Engineering (CSE)'
    }
  });
};
