const jwt = require('jsonwebtoken')
const {JWT_SECRET_KEY} = require('../keys')
const mongoose = require("mongoose");

const User = require("../models/user");
module.exports = (req,res,next)=>{
    const {tokn} = req.headers
    console.log(tokn)
    
    if(!tokn){
       return res.status(401).json({error:"you must be logged in"})
    }
    const token = tokn.replace("12 ","")
    jwt.verify(token,JWT_SECRET_KEY,(err,payload)=>{
        if(err){
         return   res.status(401).json({error:"you must be logged in1"})
        }
        
        const {_id} = payload
        User.findById(_id).then(userdata=>{
            req.user = userdata
            console.log("1",userdata)
            next()
        })
        
        
    })
}