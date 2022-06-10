const router = require("express").Router();
const Joi = require("joi");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const {JWT_SECRET_KEY}=require('../keys')

const verify=require('../middleware/verify')

router.get('/verify',verify,(req,res)=>{
  res.send('Hello User')
})

router.post("/signup", async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { firstname,lastname, email, password } = req.body;
 

  if (!validatedomain(email))
    return res.status(400).json({ msg: "Invalid Domain" });

  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("Email Already Exist");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    password: hashedPassword,
  });

  try {
    const savedUser = await user.save();
    res.json({ message: "Register Sucessfully" });
  } catch (error) {
    res.status(400).send(error,"In server");
  }
}); 

router.post("/signin", async (req, res) => {
  try {
    const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //check if email not exist
  const user = await User.findOne({ email: req.body.email });

  
  if (!user) return res.status(400).send("Email doesn't Exist");
  

  //password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if (!validPass) return res.status(400).send("Inavlid Email or Password ");

  const token = jwt.sign({ _id: user._id }, JWT_SECRET_KEY);
 
  const {_id,firstname,lastname,email,isAdmin,followers,following}=user
 // res.json({data:token,user:{_id,firstname,lastname,email}})
  res.send({token,user:{_id,firstname,lastname,email,isAdmin,followers,following}})
 //const user1={_id,firstname,lastname,email}
  //res.status(200).send({ data: token ,message: "logged in successfully" });
 //res.header("auth-token", token).send(token);
  

 // return res.status(200).send({message:"Successfully Signed In"})
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/getallusers", verify,async(req, res) => {
  try {
      const users = await User.find()
      res.send(users)
  } catch (error) {
      console.log(error)
      return res.status(400).json(error);
  }
});

router.get("/followersfollowing", verify,async(req, res) => {
  try {
      const userinfo = await User.find({_id:req.user._id})
      console.log(userinfo)
      res.send(userinfo)
  } catch (error) {
      console.log(error)
      return res.status(400).json(error);
  }
});

router.get('/user/:id',verify,(req,res)=>{
  User.findOne({_id:req.params.id})
  .select("-password")
  .then(user=>{
       Post.find({postedBy:req.params.id})
       .populate("postedBy","_id name")
       .exec((err,posts)=>{
           if(err){
               return res.status(422).json({error:err})
           }
           res.json({user,posts})
       })
  }).catch(err=>{
      return res.status(404).json({error:"User not found"})
  })
})

router.post("/deleteuser",verify,async(req,res)=>{
  
  const {userId}=req.body
  try {
     await User.find({_id:userId}).remove()
     res.send('User Deleted Successfully');
  } catch (error) {
    return res.status(400).json({message: error})
  }
  })

function validatedomain(email) {
  const allowedEmailDomain = "tothenew.com";
  if (email.split("@")[1] === allowedEmailDomain) {
    return true;
  } else {
    return false;
  }
}



const registerValidation = (data) => {
  const schema = Joi.object({
    firstname: Joi.string().min(4).required(),
    lastname: Joi.string().min(4).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

module.exports = router;
