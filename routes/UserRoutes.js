const express = require('express')
const { User } = require('../models/UserSchema')
const route = express.Router()
const auth = require('../middleware/auth')
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require('dotenv/config')

route.get('/', async (req, res) => {

   const user = await User.find().populate('listServer')

   if(!user) {
      res.status(500).json({
         success: false
      })
   }

   res.send(user)
})

route.post(`/`, async (req, res) => {

   try {
      const { username, password } = req.body

      if(!(username, password)) {
         res.status(400).send('Missing username or password!')
      }

      // test

      const userAccount = await User
      .findOne({username: username})
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
      .select('-username -__v')

      if(userAccount && (await bcrypt.compare(password, userAccount.password))) {

         const token = jwt.sign(
            {userAccount_id: userAccount._id, username}, 
            process.env.TOKEN_KEY
         )

         userAccount.token = token
         
         req.io.sockets.emit(
            "LogIn",
            {
               token: token
            }
         )
         res.status(200).send(userAccount)
      } else {
         res.status(400).send('Invalid Username/Password!')
      }
   } catch(error) {
      console.log(error)
   }
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

route.post(`/register`, async (req, res) => {

   try {

      const {nickname, username, password} = req.body

      if(!(nickname && username && password)) {
         res.status(400).send("Please check your username and password")
      }

      const oldUser = await User.findOne({username})

      if(oldUser) return res.status(400).send("Your account is exists!")

      const encryptedPassword = await bcrypt.hash(password, 12)

      let user = await User.create({
   
         nickname: nickname,
         username: username,
         password: encryptedPassword
      })

      const token = jwt.sign(
         { user_id: user._id, username },
         process.env.TOKEN_KEY,
         {
           expiresIn: "2h",
         }
      );

      user.token = token
      
      res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
})

module.exports = route