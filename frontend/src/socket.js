import { io } from 'socket.io-client'

const URL = window.__CONFIG__?.BACKEND_URL || 'http://localhost:4000' || 'https://intervuepoll-3igv.onrender.com'

let socket
export function getSocket() {
  if (!socket) {
    socket = io(URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    })
  }
  return socket
}

export function registerUser(name, role) {
  const s = getSocket()
  s.emit('register', { name, role })
}

export default getSocket




