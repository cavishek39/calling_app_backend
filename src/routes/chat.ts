import express from 'express'
import authMiddleware from '../middleware/auth'
import Message from '../models/Message'

const router = express.Router()

// Get chat history between two users
router.get('/history/:userId', authMiddleware, async (req, res) => {
  try {
    const myId = req.user._id
    const otherId = req.params.userId
    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: otherId },
        { sender: otherId, receiver: myId },
      ],
    }).sort({ createdAt: -1 })
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
