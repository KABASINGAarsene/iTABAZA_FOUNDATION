const { UserModel } = require("./Backend/models/user.model");
const bcrypt = require("bcrypt");
require("dotenv").config();

async function createUser() {
  const email = "j.nishimwealustudent.com";
  const password = "k#+ymej@AQ@3";
  
  try {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      console.log("User already exists with this email");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 5);
    
    // Create user data
    const userData = {
      first_name: "J",
      last_name: "Nishimwe",
      email: email,
      mobile: "1234567890", // You can change this if needed
      password: hashedPassword,
    };

    // Create user in database
    const user = await UserModel.create(userData);
    console.log("User created successfully:");
    console.log("ID:", user.id);
    console.log("Email:", user.email);
    console.log("Name:", user.first_name, user.last_name);
    
    console.log("\nLogin credentials:");
    console.log("Email:", email);
    console.log("Password:", password);
    
  } catch (error) {
    console.error("Error creating user:", error.message);
  }
}

createUser();
