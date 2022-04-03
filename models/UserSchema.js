const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({

   nickname: String,
   username: String,
   password: String,
   listServer: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'server'
   }],
   token: String
   // voiceActivity: {
   //    statusConnected: true,
   //    voiceChannel: 
   // }
})

exports.User = mongoose.model('user', UserSchema)