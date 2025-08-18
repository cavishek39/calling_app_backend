# Call App Backend Documentation

## Overview

A robust Node.js + Express backend for a real-time calling and chat app (audio/video), with push notifications, security best practices, and REST + Socket.io APIs. Integrates with Expo for notifications and supports MongoDB for data storage.

---

## Features

- User authentication (JWT, password hashing)
- Real-time chat (Socket.io, MongoDB)
- Real-time audio/video call signaling (Socket.io, WebRTC signaling)
- Push notifications (Expo)
- Call and chat history endpoints
- Security: helmet, CORS, rate limiting, input validation, user status checks
- Graceful shutdown, error handling
- Refresh token support for access token renewal

---

## Tech Stack

- Node.js, Express
- MongoDB (Mongoose)
- Socket.io
- Expo push notifications
- bcryptjs, jsonwebtoken
- helmet, express-rate-limit, express-validator

---

## Project Structure

```
src/
  index.ts                # Main server file
  models/                 # Mongoose models (User, Message, Call)
  routes/                 # Express routes (auth, chat, call)
  middleware/             # Auth middleware
  utils/                  # Helpers, notification sender
```

---

## Setup & Installation

1. Clone the repo
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/call-app
   JWT_SECRET=your_super_secret_key
   ```
4. Start the server:
   ```sh
   npm run dev
   ```

---

## API Endpoints

### Auth

- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login user
- `POST /api/auth/expo-push-token` — Save Expo push token
- `POST /api/auth/refresh-token` — Get new access token using refresh token

### Chat

- `GET /api/chat/history/:userId` — Get chat history with a user

### Call

- `GET /api/call/history` — Get call history

---

## Socket.io Events

### Chat

- `CHAT_MESSAGE` — Send/receive chat message
- `CHAT_TYPING` / `CHAT_STOP_TYPING` — Typing indicators
- `MESSAGE_READ` — Mark message as read

### Call

- `CALL_REQUEST` — Initiate call
- `CALL_ACCEPT` — Accept call
- `CALL_REJECT` — Reject call
- `CALL_ENDED` — End call
- `CALL_BUSY` — User is busy
- `CALL_TIMEOUT` — Call not answered
- `ICE_CANDIDATE` — WebRTC signaling

---

## Push Notifications

- Sent via Expo for incoming calls and messages
- Users must register their Expo push token via `/api/auth/expo-push-token`

---

## Security

- JWT authentication for all protected routes
- Helmet for secure HTTP headers
- CORS restricted to trusted origins
- Rate limiting on auth endpoints
- Input validation/sanitization (express-validator)
- User status checks (active/banned/deleted)
- Passwords hashed with bcryptjs
- Refresh tokens stored securely in database

---

## Environment Variables

- `PORT` — Server port
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret

---

## Development & Testing

- Use Postman or curl for API testing
- Use Expo Go for push notification testing
- Socket.io events can be tested with frontend or socket.io-client
- Test refresh token flow: login to get refresh token, use `/api/auth/refresh-token` to get new access token

---

## Contribution & License

- PRs welcome! Please follow code style and add tests for new features.
- MIT License

---

## Contact & Support

- For issues, open a GitHub issue or contact the maintainer.

---

## TODO / Future Improvements

- End-to-end message encryption
- Group calls and group chat
- Admin dashboard
- Call quality analytics
- Media storage
- Audit logging
