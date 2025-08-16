import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import authMiddleware from '../middleware/auth'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// Register
router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    try {
      const { username, email, password } = req.body
      // Check for duplicate user
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      })
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists.' })
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = new User({ username, email, password: hashedPassword })
      await user.save()
      res.status(201).json({ message: 'User registered successfully.' })
    } catch (err) {
      res.status(500).json({ error: 'Server error.' })
    }
  }
)

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    try {
      const { email, password } = req.body
      const user = await User.findOne({ email })
      if (!user || user.status !== 'active') {
        return res
          .status(401)
          .json({ error: 'Invalid credentials or user not active.' })
      }
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials.' })
      }
      // Generate JWT
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      )
      res.json({
        token,
        user: { id: user._id, username: user.username, email: user.email },
      })
    } catch (err) {
      res.status(500).json({ error: 'Server error.' })
    }
  }
)

// Save or update Expo push token
router.post('/expo-push-token', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id
    const { expoPushToken } = req.body
    if (!expoPushToken) {
      return res.status(400).json({ error: 'Expo push token required.' })
    }
    await User.findByIdAndUpdate(userId, { expoPushToken })
    res.json({ message: 'Expo push token updated.' })
  } catch (err) {
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
