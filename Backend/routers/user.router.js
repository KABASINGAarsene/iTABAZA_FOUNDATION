const { UserModel } = require("../models/user.model");
const userRouter = require("express").Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const redis = require("redis");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

userRouter.use(cors());
var otp;

userRouter.get("/", async (req, res) => {
  res.send({ msg: "Home Page" });
});

userRouter.post("/emailVerify", async (req, res) => {
  otp = otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  let { email } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Here is your OTP for iTABAZA Login",
    text: otp,
  };

  transporter
    .sendMail(mailOptions)
    .then((info) => {
      console.log(info.response);
      res.send({ msg: "Mail has been Send", otp, email });
    })
    .catch((e) => {
      console.log(e);
      res.send(e);
    });
});

userRouter.post("/signup", async (req, res) => {
  let { first_name, last_name, email, mobile, password } = req.body;
  
  // Debug logging
  console.log("🔍 OTP Signup attempt:", {
    first_name,
    last_name,
    email,
    mobile,
    hasPassword: !!password
  });
  
  try {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return res.status(500).send({
        msg: "User already registered",
      });
    }

    // Check if mobile already exists
    const existingMobile = await UserModel.findByMobile(mobile);
    if (existingMobile) {
      console.log("❌ Mobile already exists:", mobile);
      return res.status(500).send({
        msg: "Mobile number already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 5);
    
    // Create user data
    const userData = {
      first_name,
      last_name,
      email,
      mobile,
      password: hashedPassword,
    };

    console.log("✅ Creating user in database...");
    // Create user in Supabase
    const user = await UserModel.create(userData);
    console.log("✅ User created successfully:", { id: user.id, email: user.email });
    
    res.status(201).send({ msg: "Signup Successful", user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).send({
      msg: "Error during signup",
      error: error.message
    });
  }
});

// Direct signup without OTP (alternative endpoint)
userRouter.post("/signup-direct", async (req, res) => {
  let { first_name, last_name, email, mobile, password } = req.body;
  
  try {
    // Validate required fields
    if (!first_name || !last_name || !email || !mobile || !password) {
      return res.status(400).send({
        msg: "All fields are required"
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).send({
        msg: "User already registered with this email",
      });
    }

    // Check if mobile already exists
    const existingMobile = await UserModel.findByMobile(mobile);
    if (existingMobile) {
      return res.status(400).send({
        msg: "Mobile number already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 5);
    
    // Create user data
    const userData = {
      first_name,
      last_name,
      email,
      mobile,
      password: hashedPassword,
    };

    // Create user in Supabase
    const user = await UserModel.create(userData);
    
    // Generate JWT token for immediate login
    const token = jwt.sign(
      { userID: user.id, email: user.email },
      process.env.JWT_SECRET || "masai"
    );
    
    res.status(201).send({ 
      msg: "Signup Successful", 
      user: { 
        id: user.id, 
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        mobile: user.mobile
      },
      token
    });
  } catch (error) {
    console.error("Direct signup error:", error);
    res.status(500).send({
      msg: "Error during signup",
      error: error.message
    });
  }
});

userRouter.post("/signin", async (req, res) => {
  let { payload, password } = req.body;
  
  // Debug logging
  console.log("🔍 Signin attempt:", {
    payload,
    hasPassword: !!password
  });
  
  try {
    // Try to find user by email first
    let user = await UserModel.findByEmail(payload);
    console.log("🔍 User found by email:", !!user);
    
    // If not found by email, try mobile
    if (!user) {
      user = await UserModel.findByMobile(payload);
      console.log("🔍 User found by mobile:", !!user);
    }
    
    if (!user) {
      console.log("❌ User not found:", payload);
      return res.status(500).send({ msg: "User not Found" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(500).send({ msg: "Wrong Password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userID: user.id, email: user.email },
      process.env.JWT_SECRET || "masai"
    );

    res.send({
      message: "Login Successful",
      token,
      id: user.id,
      name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      mobile: user.mobile,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).send({ msg: "Error in Login", error: error.message });
  }
});

// Get all users endpoint (for doctor dashboard patient selection)
userRouter.get("/get-all-users", async (req, res) => {
  try {
    const users = await UserModel.findAll();
    res.status(200).json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ 
      success: false,
      msg: "Error fetching users", 
      error: error.message 
    });
  }
});

// Real-time user updates using Supabase
userRouter.get("/realtime", async (req, res) => {
  try {
    const { supabase } = require("../config/db");
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        (payload) => {
          console.log('User change:', payload);
        }
      )
      .subscribe();

    res.json({ message: "Real-time subscription set up" });
  } catch (error) {
    res.status(500).send({ msg: "Error setting up real-time", error: error.message });
  }
});

// userRouter.use(express.text());
// const client = redis.createClient({
//   password: process.env.redisPassword,
//   socket: {
//     host: process.env.redisHost,
//     port: process.env.redisPort,
//   },
// });
// client.on("error", (err) => console.log(err, "ERROR in REDIS"));
// client.connect();

// userRouter.get("/logout", async (req, res) => {
//   const token = req.headers.authorization;
//   // console.log(token)
//   if (!token) {
//     return res.status(500).send({ msg: "No Token in Headers" });
//   }
//   try {
//     await client.LPUSH("token", token);
//     // await client.lpush("token", token)
//     res.status(200).send({ msg: "You are Logged out" });
//   } catch (error) {
//     return res.status(500).send({ msg: "Error in Redis" });
//   }
// });

module.exports = {
  userRouter,
};
