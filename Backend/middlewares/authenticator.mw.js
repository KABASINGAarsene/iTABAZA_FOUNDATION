const express = require('express');
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();

// app.use(express.text());
// const client = redis.createClient({
//   password: process.env.redisPassword,
//   socket: {
//       host: process.env.redisHost,
//       port: process.env.redisPort
//   }
// });
// client.on("error", (err) => console.log(err, "ERROR in REDIS"));
// client.connect();


const authenticate = async (req, res, next) => {
  let token = req.headers?.authorization;
  
  // Enhanced logging for debugging
  console.log("[AUTH] From Middleware - Authorization header:", token);
  console.log("[AUTH] Request method:", req.method);
  console.log("[AUTH] Request URL:", req.url);
  
  if (!token) {
    console.log("[AUTH] No authorization token provided");
    return res.status(401).send({ msg: "Enter Token First" });
  }
  
  // Extract token if it starts with 'Bearer '
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  
  try {
    // const blacklistdata = await client.LRANGE("token", 0, -1);
    // console.log(blacklistdata)
    // if (blacklistdata.includes(token)) {
    //   return res.send({ msg: "Token Blackilsted/Logout" });
    // }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "masai");
    
    if (decoded) {
      const userID = decoded.userID || decoded.id || decoded.userId;
      const email = decoded.email;
      
      // Enhanced logging
      console.log('[AUTH] Token decoded successfully:');
      console.log('  - UserID:', userID);
      console.log('  - Email:', email);
      console.log('  - Full decoded token:', JSON.stringify(decoded, null, 2));
      
      // Validate that we have essential information
      if (!userID) {
        console.log('[AUTH ERROR] No valid user ID found in token');
        return res.status(401).send({ 
          msg: "Invalid token - missing user identification",
          debug: "Token decoded but no userID, id, or userId field found"
        });
      }
      
      // Set user information in request body
      req.body.userID = userID;
      req.body.email = email;
      
      // Also set in custom header for additional access
      req.headers['x-user-id'] = userID;
      req.headers['x-user-email'] = email;
      
      console.log('[AUTH] User information added to request:');
      console.log('  - req.body.userID:', req.body.userID);
      console.log('  - req.body.email:', req.body.email);
      
      next();
    } else {
      console.log('[AUTH ERROR] Token verification returned null/undefined');
      res.status(401).send({ msg: "Wrong Token" });
    }
  } catch (e) {
    console.error("[AUTH ERROR] Token verification error:", e.message);
    console.error("[AUTH ERROR] Token that failed:", token.substring(0, 20) + '...');
    res.status(401).send({ 
      msg: "Token Expired or Invalid",
      error: e.message
    });
  }
};

module.exports = {
  authenticate
};
