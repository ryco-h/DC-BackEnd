const mongoose = require('mongoose')

const TextChannelSchema = new mongoose.Schema({

   channelName: String,
   serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'server'
   },
   messages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'message'
   }],
})

exports.TextChannel = mongoose.model('textChannel', TextChannelSchema)