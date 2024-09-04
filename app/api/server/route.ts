import { Server } from 'socket.io'

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
    })

    const users = new Map()

    io.on('connection', (socket) => {
      const userId = socket.id
      users.set(userId, { id: userId })

      io.emit('updateUserList', Array.from(users.values()))

      socket.on('callUser', ({ to, offer }) => {
        io.to(to).emit('incomingCall', { from: socket.id, offer })
      })

      socket.on('acceptCall', ({ to, answer }) => {
        io.to(to).emit('callAccepted', { answer })
      })

      socket.on('iceCandidate', ({ to, candidate }) => {
        io.to(to).emit('iceCandidate', { candidate })
      })

      socket.on('disconnect', () => {
        users.delete(userId)
        io.emit('updateUserList', Array.from(users.values()))
      })
    })

    res.socket.server.io = io
  }
  res.end()
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default ioHandler