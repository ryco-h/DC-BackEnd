const express = require('express')
const { default: mongoose } = require('mongoose')
const { Message } = require('../models/MessageSchema')
const { Server } = require('../models/ServerSchema')
const { TextChannel } = require('../models/TextChannelSchema')
const { User } = require('../models/UserSchema')
const route = express.Router()
var bodyParser = require('body-parser')
const jwt = require("jsonwebtoken");
const auth = require('../middleware/auth')
var atob = require('atob');

function parseJWT(token) {

   var base64Url = token.split('.')[1];
   var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
   var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
   }).join(''));

   return JSON.parse(jsonPayload);
}

// Server handler
route.get('/', async (req, res) => {

   const servers = await Server
   .find()
   // .populate({
   //    path: 'textChannel listUser',
   //    select: '-username -password -messages',
   // })

   if(!servers) {
      res.status(500).json({
         success: false 
      })
   }

   res.send(servers)
}) 

route.get('/:id', auth, async (req, res) => {

   const user = parseJWT(req.body.token || req.query.token || req.headers["x-access-token"])

   // const servers = await Server
   // .find({_id: req.params.id})
   // .populate({
   //    path: 'listUser',
   //    populate: {
   //       path: 'listServer',
   //       select: 'id serverName'
   //    }
   // })
   // .populate({
   //    path: 'textChannel',
   //    populate: 'messages'
   // })
   try {
      Server.findById(req.params.id, async (err, data) => {
         
         if (data.listUser.map(user => user._id.toString()).includes(user.userAccount_id)) {
            const servers = await Server
            .find({_id: req.params.id})
            .populate({
               path: 'listUser',
               populate: {
                  path: 'listServer',
                  select: 'id serverName'
               }
            })
            .populate({
               path: 'textChannel',
               populate: {
                  path: 'messages',
                  populate: 'userId'
               }
            })

            res.send(servers)
         } else {
            res.send("Access Denied!")
         }
      })
   } catch(error) {
      res.send({status: 400, message: error})
   }
   // if(!server) {
   //    res.status(500).json({
   //       success: false
   //    })
   // }

   // res.send(server)
})

route.post(`/`, async (req, res) => {

   let server = new Server({

      serverName: req.body.serverName,
      ownerId: req.body.ownerId,
      listUser: req.body.listUser,
      voiceChannel: req.body.voiceChannel,
      textChannel: req.body.textChannel
   })
   
   let generalTextChannel = await TextChannel.create({

      channelName: 'general',
      serverId: server._id,
      messages: []
   })

   server = await server.save()

   if(server) {

      server = await Server.findByIdAndUpdate(
         server._id,
         {
            serverName: req.body.serverName,
            ownerId: req.body.ownerId,
            listUser: req.body.listUser,
            voiceChannel: req.body.voiceChannel,
            $push: {textChannel: generalTextChannel._id}
         }, 
         { new: true }
      )

      if(server) return res.status(200).send('Server created successfully!')
   }
   console.log(generalTextChannel)

   res.send(server)
})

// Text Channel handler
route.get(`/text-channel`, async (req, res) => {

   const listChannel = await TextChannel
   .find()
   .populate({
      path: 'messages',
      select: '-__v -textChannelId -serverId',
      populate: {
         path: 'userId',
         select: '-__v -username -password'
      }
   })

   res.send(listChannel)
})

route.post(`/text-channel`, async (req, res) => {

   let textChannel = new TextChannel({

      channelName: req.body.channelName,
      serverId: req.body.serverId,
      messages: req.body.messages
   })
 
   textChannel = await textChannel.save()

   res.send(textChannel)
})

// Message handler
route.get(`/text-channel/message/:id`, async (req, res) => {

   const listMessage = await Message.find({textChannelId: req.params.id})

   res.send(listMessage)
})

route.delete(`/text-channel/:idTextChannel/:idMessage`, auth, (req, res) => {

   TextChannel.findById(req.params.idTextChannel, async (err, data) => {
      
      if(data.messages.map(message=>message.toString()).includes(req.params.idMessage)) {
         const textChannel = await TextChannel.updateOne(
            {
               _id: req.params.idTextChannel
            }, {
               $pull: {
                  messages: {
                     $in: req.params.idMessage
                  }
               }
            }
         )

         if (textChannel) {
            Message.findByIdAndDelete(req.params.idMessage, function (err, docs) {
               if (err){
                  res.send("Can't delete message!")
               }
               else{
                  res.send("Message deleted!")
                  req.io.sockets.emit(
                     "DeletedMessage",
                     {
                        idMessage: docs._id
                     }
                  )
               }
           })
         } else {
            res.send("Can't delete message!")
         }
      } else {
         res.send("ID Not Found!")
      }
   })
   // const message = await Message.findByIdAndDelete({_id: req.params.idMessage})

   // if (!message) {
   //    res.send("Can't delete message with ID: " + req.params.id)
   // } else {
   //    res.status(200).send({
   //       message: 'Message deleted!',
   //       status: 'Success'
   //    })
   // }
})

route.post(`/text-channel/message`, async (req, res) => {

   console.log(req.body.textChannelId)
 
   let message = new Message({

      userId: req.body.userId,
      textChannelId: req.body.textChannelId,
      serverId: req.body.serverId,
      message: req.body.message,
      dateCreated: new Date()
   })

   message = await message.save()
   
   let textChannel = await TextChannel.findByIdAndUpdate(
      req.body.textChannelId,
      {
         channelName: req.body.channelName,
         serverId: req.body.serverId,
         $push: {messages: message._id}
      }, 
      {
         new: true
      }
   ).catch(error => res.send(error))
   
   if (!textChannel) {
      return res.status(500).send({
         message: "Text Channel can't be updated!",
         data: textChannel
      });
   } else {
      User.findById(req.body.userId, (err, doc, data) => {
         req.io.sockets.emit(
            "MessageSent",
            {
               _id: req.body._id,
               userId: {
                  _id: doc._id,
                  nickname: doc.nickname
               },
               textChannelId: req.body.textChannelId,
               serverId: req.body.serverId,
               message: req.body.message,
               dateCreated: new Date()
            }
         )
      })
      
      res.send(textChannel)
   }
})

module.exports = route