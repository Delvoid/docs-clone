require('dotenv').config()
const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')

const Document = require('./Document')
const connectDb = require('./utils/connectDb')

//connect to mongo db
connectDb()

const PORT = process.env.PORT || 5000

// const io = require('socket.io')(PORT_SOCKET, {
//   cors: {
//     origin: ['http://localhost:3000', 'http://192.168.0.14:3000', 'http://localhost:5000'],
//     methods: ['GET', 'POST'],
//   },
// })

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const defaultValue = ''

io.on('connection', (socket) => {
  console.log('connected')

  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit('load-document', document.data)

    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('recieve-changes', delta)
    })

    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })
})

const findOrCreateDocument = async (id) => {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')))
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'))
  )
}
console.log(`dir ${__dirname}`)
app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on ${PORT}`))
