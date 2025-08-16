import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import callRoutes from './routes/call'
import Call from './models/Call'
import chatRoutes from './routes/chat'
import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import SocketsEvents from './utils/socket-events'
import cors from 'cors'
import helmet from 'helmet'
import Message from './models/Message'

import { isUserBusy } from './utils/helpers/isUserBusy'
import User from './models/User'
import { sendExpoNotification } from './utils/sendExpoNotification'
import { HealthChecker } from './utils/healthChecker'

dotenv.config()

const app = express()
const server = http.createServer(app)

app.use(helmet())
app.use(
  cors({
    origin: [
      'https://your-frontend-domain.com',
      'http://localhost:19006', // Expo local dev
      'http://localhost:8081', // Local dev
    ],
    methods: ['GET', 'POST'],
  })
)
app.use(express.json())

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests, please try again later.',
})

const PORT = process.env.PORT || 3000
const io = new Server(server, {
  cors: {
    origin: '*', // TODO: restrict in production
    methods: ['GET', 'POST'],
  },
})

// Health route
app.get('/health', async (req, res) => {
  const authOk = await HealthChecker.checkAuthService()
  const dbOk = await HealthChecker.checkDbConnection()
  const appOk = await HealthChecker.checkAppCode()
  const allOk = authOk && dbOk && appOk
  res.json({
    status: allOk ? 'OK' : 'FAIL',
    auth: authOk,
    db: dbOk,
    app: appOk,
  })
})

// Only start server if all health checks pass
const validateCriticalServices = async () => {
  const authOk = await HealthChecker.checkAuthService()
  const dbOk = await HealthChecker.checkDbConnection()
  const appOk = await HealthChecker.checkAppCode()
  console.log('Health check results:', {
    auth: authOk,
    db: dbOk,
    app: appOk,
  })
  if (authOk && dbOk && appOk) {
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`)
    })
  } else {
    console.error('Health check failed. Server not started.')
    if (!authOk) console.error('Auth service health check failed.')
    if (!dbOk) console.error('Database connection health check failed.')
    if (!appOk) console.error('Application code health check failed.')
    process.exit(1)
  }
}

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Call App Backend!')
})

// Auth routes
app.use('/api/auth', authRoutes)

// Chat routes
app.use('/api/chat', chatRoutes)

// Call routes
app.use('/api/call', callRoutes)

io.on('connection', (socket) => {
  // Track active calls per user
  const activeCalls = new Map() // userId -> callId

  // Call request
  socket.on(
    SocketsEvents.CALL_REQUEST,
    async (data: {
      to: string
      from: string
      type: 'audio' | 'video'
      offer: any
    }) => {
      // Busy user check
      if (await isUserBusy(data.to)) {
        socket.emit('CALL_BUSY', { to: data.to })
        return
      }

      // data: { to, from, type, offer }
      if (
        !data ||
        typeof data.to !== 'string' ||
        typeof data.from !== 'string' ||
        !['audio', 'video'].includes(data.type)
      ) {
        socket.emit('error', { error: 'Invalid call request' })
        return
      }
      try {
        // Create call record in DB
        const call = await Call.create({
          caller: data.from,
          receiver: data.to,
          type: data.type,
          status: 'requested',
        })

        // Notify recipient
        io.to(data.to).emit(SocketsEvents.CALL_REQUEST, {
          callId: call._id,
          from: data.from,
          type: data.type,
          offer: data.offer,
        })

        // Send push notification
        const recipient = await User.findById(data.to)
        if (recipient?.expoPushToken) {
          await sendExpoNotification(
            recipient.expoPushToken,
            'Incoming Call',
            `${data.from} is calling you!`,
            { callId: call._id, type: data.type }
          )
        }

        // Track call for timeout
        activeCalls.set(data.from, call._id)
        // Set timeout for unanswered call (e.g., 30s)
        setTimeout(async () => {
          const currentCall = await Call.findById(call._id)
          if (currentCall && currentCall.status === 'requested') {
            currentCall.status = 'missed'
            await currentCall.save()
            io.to(data.from).emit('CALL_TIMEOUT', { callId: call._id })
            io.to(data.to).emit('CALL_TIMEOUT', { callId: call._id })
            activeCalls.delete(data.from)
          }
        }, 30000)
      } catch (err) {
        socket.emit('error', { error: 'Failed to initiate call.' })
      }
    }
  )

  // Call accept
  socket.on(
    SocketsEvents.CALL_ACCEPT,
    async (data: { callId: string; to: string; from: string; answer: any }) => {
      // data: { callId, to, from, answer }
      if (
        !data ||
        typeof data.callId !== 'string' ||
        typeof data.to !== 'string' ||
        typeof data.from !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid call accept' })
        return
      }
      try {
        // Update call status
        await Call.findByIdAndUpdate(data.callId, { status: 'accepted' }) // Update the call status to 'accepted'
        // Notify caller
        io.to(data.to).emit(SocketsEvents.CALL_ACCEPT, {
          callId: data.callId,
          from: data.from,
          answer: data.answer,
        })
      } catch (err) {
        socket.emit('error', { error: 'Failed to accept call.' })
      }
    }
  )

  // Call reject
  socket.on(
    SocketsEvents.CALL_REJECT,
    async (data: { callId: string; to: string; from: string }) => {
      if (
        !data ||
        typeof data.callId !== 'string' ||
        typeof data.to !== 'string' ||
        typeof data.from !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid call reject' })
        return
      }
      try {
        await Call.findByIdAndUpdate(data.callId, { status: 'rejected' }) // Update the call status to 'rejected'

        // Notify participants
        io.to(data.to).emit(SocketsEvents.CALL_REJECT, {
          callId: data.callId,
          from: data.from,
        })
      } catch (err) {
        socket.emit('error', { error: 'Failed to reject call.' })
      }
    }
  )

  // Call end
  socket.on(
    SocketsEvents.CALL_ENDED,
    async (data: {
      callId: string
      to: string
      from: string
      endedAt?: Date
      dataUsage?: number
    }) => {
      if (
        !data ||
        typeof data.callId !== 'string' ||
        typeof data.to !== 'string' ||
        typeof data.from !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid call end' })
        return
      }
      try {
        // Update call record in DB as ended
        await Call.findByIdAndUpdate(data.callId, {
          status: 'ended',
          endedAt: data.endedAt || new Date(),
          dataUsage: data.dataUsage || 0,
        })

        // Notify participants
        io.to(data.to).emit(SocketsEvents.CALL_ENDED, {
          callId: data.callId,
          from: data.from,
        })
      } catch (err) {
        socket.emit('error', { error: 'Failed to end call.' })
      }
    }
  )

  // ICE candidate exchange
  socket.on(SocketsEvents.ICE_CANDIDATE, (data) => {
    // data: { to, candidate }
    if (!data || typeof data.to !== 'string' || !data.candidate) {
      socket.emit('error', { error: 'Invalid ICE candidate' })
      return
    }
    io.to(data.to).emit(SocketsEvents.ICE_CANDIDATE, {
      candidate: data.candidate,
    })
  })

  // Real-time chat message handler
  socket.on(
    SocketsEvents.CHAT_MESSAGE,
    async (data: { to: string; content: string; from: string }) => {
      // data: { to, content, from }
      if (
        !data ||
        typeof data.to !== 'string' ||
        typeof data.content !== 'string' ||
        !data.content.trim() ||
        typeof data.from !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid chat message' })
        return
      }
      let message = null
      let attempts = 0
      const maxAttempts = 3
      let lastError = null
      while (attempts < maxAttempts && !message) {
        try {
          // Save the message to MongoDB first
          message = await Message.create({
            sender: data.from,
            receiver: data.to,
            content: data.content,
            delivered: true,
          })
        } catch (err) {
          lastError = err
          attempts++
          // Optionally, add a short delay before retrying
          await new Promise((resolve) => setTimeout(resolve, 100 * attempts))
        }
      }
      if (!message) {
        socket.emit('error', { error: 'Failed to send message after retries.' })
        return
      }

      // Emit to recipient (if online)
      io.to(data.to).emit(SocketsEvents.CHAT_MESSAGE, {
        _id: message._id,
        sender: data.from,
        receiver: data.to,
        content: data.content,
        delivered: true,
        createdAt: message.createdAt,
      })
      // Optionally, emit to sender for confirmation
      socket.emit('chat delivered', { _id: message._id })

      // Send push notification to recipient
      const recipient = await User.findById(data.to)
      if (recipient?.expoPushToken) {
        await sendExpoNotification(
          recipient.expoPushToken,
          'New Message',
          `${data.from}: ${data.content}`,
          { messageId: message._id, from: data.from }
        )
      }
    }
  )

  // Start Typing event
  socket.on(SocketsEvents.CHAT_TYPING, (data: { to: string; from: string }) => {
    if (!data || typeof data.to !== 'string' || typeof data.from !== 'string') {
      socket.emit('error', { error: 'Invalid typing event' })
      return
    }
    io.to(data.to).emit(SocketsEvents.CHAT_TYPING, { from: data.from })
  })

  // Stop Typing event
  socket.on(
    SocketsEvents.CHAT_STOP_TYPING,
    (data: { to: string; from: string }) => {
      if (
        !data ||
        typeof data.to !== 'string' ||
        typeof data.from !== 'string'
      ) {
        socket.emit('error', { error: 'Invalid stop typing event' })
        return
      }
      io.to(data.to).emit(SocketsEvents.CHAT_STOP_TYPING, { from: data.from })
    }
  )

  // Handle user joining
  socket.on(SocketsEvents.CALL_REQUEST, (data: any) => {
    if (!data || typeof data.to !== 'string' || !data.offer) {
      socket.emit('error', { error: 'Invalid call request' })
      return
    }
    console.log(`User ${data.to} has requested a call`)
    io.to(data.to).emit(SocketsEvents.CALL_REQUEST, {
      from: socket.id,
      offer: data.offer,
    })
  })

  // Message read event
  socket.on(SocketsEvents.MESSAGE_READ, async (data: { messageId: string }) => {
    if (!data || typeof data.messageId !== 'string') {
      socket.emit('error', { error: 'Invalid message read event' })
      return
    }

    try {
      await Message.findByIdAndUpdate(data.messageId, { read: true })
      io.to(socket.id).emit(SocketsEvents.MESSAGE_READ, {
        messageId: data.messageId,
      })
    } catch (error) {
      socket.emit('error', { error: 'Failed to mark message as read' })
    }
  })

  // Handle user accepting a call
  socket.on(SocketsEvents.CALL_ACCEPT, (data: any) => {
    if (!data || typeof data.to !== 'string' || !data.offer) {
      socket.emit('error', { error: 'Invalid call accept' })
      return
    }
    console.log(`User ${data.to} has accepted the call`)
    io.to(data.to).emit(SocketsEvents.CALL_ACCEPT, {
      from: socket.id,
      offer: data.offer,
    })
  })
})

await validateCriticalServices()

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})
