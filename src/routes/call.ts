import express from 'express'
import authMiddleware from '../middleware/auth'
import Call from '../models/Call'

const router = express.Router()

// Get call history for a user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id
    console.log('Fetching call history for user:', userId)
    const calls = await Call.find({
      $or: [{ caller: userId }, { receiver: userId }],
    }).sort({ startedAt: -1 })
    res.json(calls)
  } catch (err) {
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
