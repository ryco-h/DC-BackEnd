const mongoose = require('mongoose')

const MessageSchema = new mongoose.Schema({

   userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
   },
   textChannelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'textChannel'
   },
   serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'server'
   },
   message: String,
   dateCreated: Date
})

exports.Message = mongoose.model('message', MessageSchema)