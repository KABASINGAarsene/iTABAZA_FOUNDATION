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
  console.log("From Middleware:", token);
  
  if (!token) {
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
      const userID = decoded.userID;
      const email = decoded.email;
      console.log('Middleware Console', userID, email);
      req.body.userID = userID;
      req.body.email = email;
      next();
    } else {
      res.status(401).send({ msg: "Wrong Token" });
    }
  } catch (e) {
    console.error("Token verification error:", e);
    res.status(401).send({ msg: "Token Expired or Invalid" });
  }
};

module.exports = {
  authenticate
};
