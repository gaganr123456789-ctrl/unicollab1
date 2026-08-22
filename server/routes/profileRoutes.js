import express from 'express';
import { usersDB } from '../db/dataStore.js';

const router = express.Router();

// GET /api/profile
router.get('/', (req, res) => {
  const user = usersDB[0];
  return res.status(200).json({
    success: true,
    profile: user
  });
});

// PUT /api/profile/update
router.put('/update', (req, res) => {
  const { name, email, major, university, age, phone, gender, bio, skills } = req.body;

  const user = usersDB[0];
  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found.' });
  }

  if (name) {
    user.name = name;
    user.initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'US';
  }
  if (email) user.email = email;
  if (major) user.major = major;
  if (university) user.university = university;
  if (age) user.age = Number(age);
  if (phone) user.phone = phone;
  if (gender) user.gender = gender;
  if (bio) user.bio = bio;
  if (skills) user.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully!',
    profile: user
  });
});

export default router;
