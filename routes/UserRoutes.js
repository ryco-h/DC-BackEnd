const express = require('express')
const { User } = require('../models/UserSchema')
const route = express.Router()

route.get('/', async (req, res) => {

   const user = await User.find().populate('listServer')

   if(!user) {
      res.status(500).json({
         success: false
      })
   }

   res.send(user)
})

route.get(`/login/:id`, async (req, res) => {
    
   if (req.params.id === undefined) {
      res.status(500).json({
         success: false,
         message: 'Invalid ID!'
      })
   }
   try {
      const user = await User
      .find({_id: req.params.id})
      .populate({
         path: 'listServer',
         populate: {
            path: 'textChannel',
            select: '-__v',
            populate: {
               path: 'messages',
               select: '-__v',
               populate: {
                  path: 'userId',
                  select: '-username -password -listServer -__v'
               }
            },
         },
      })
      .populate({
         path: 'listServer',
         populate: {
            path: 'listUser',
            select: '-username -password -listServer -__v'
         }
      })
      .select('-username -password -__v')

      if (!user) return res.status(400).send("Access must use ID!");
      
      res.send(user)
   }
   catch(error) {
      res.status(500).json({
         success: false,
         message: 'Invalid ID!'
      })
   }
})

route.post(`/`, async (req, res) => {

   let user = new User({

      nickname: req.body.nickname,
      username: req.body.username,
      password: req.body.password
   })

   user = await user.save()

   if(!user) return res.send("Failed creating account!")
   
   res.send(user)
})

module.exports = route