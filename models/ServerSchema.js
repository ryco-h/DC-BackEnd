const mongoose = require('mongoose')

const ServerSchema = new mongoose.Schema({
   
   serverName: String,
   ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
   },
   listUser: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
   }],
   textChannel: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'textChannel',
   }],
   voiceChannel: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'voiceChannel'
   }]
})

exports.Server = mongoose.model('server', ServerSchema)