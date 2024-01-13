import { io } from 'socket.io-client'

const URL = process.env.NODE_ENV === 'production' ? process.env.WEBSOCKET_SERVICE!
 : 'http://localhost:5000'

export const socket = io(URL,{
    timeout: 120000, 
    reconnection:true,
    reconnectionDelay: 1000,
    autoConnect: false
})