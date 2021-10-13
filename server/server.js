const mongoose = require('mongoose')
require('dotenv').config()
const Document = require('./Document')
const connectDb = require('./utils/connectDb')

connectDb()

const io = require('socket.io')(3001, {
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.0.14:3000'],
    methods: ['GET', 'POST'],
  },
})

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
