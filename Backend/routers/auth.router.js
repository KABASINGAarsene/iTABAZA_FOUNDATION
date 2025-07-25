const authRouter = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Import models
const { UserModel } = require("../models/user.model");
const { DoctorModel } = require("../models/doctor.model");
const { AdminModel } = require("../models/admin.model");

// Unified Login Endpoint
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  console.log(" Unified login attempt:", { email, hasPassword: !!password });
  
  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    let user = null;
    let userType = null;
    let dashboardUrl = null;

    // 1. First check if it's a patient (users table)
    try {
      console.log(" Checking for patient with email:", email);
      user = await UserModel.findByEmail(email);
      if (user) {
        console.log(" Patient found:", { id: user.id, first_name: user.first_name, last_name: user.last_name });
        console.log(" Comparing password...");
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(" Password valid:", isPasswordValid);
        
        if (isPasswordValid) {
          userType = 'patient';
          dashboardUrl = '/patient-dashboard';
          console.log(" Patient authentication successful");
        } else {
          console.log(" Patient password mismatch");
          user = null; // Reset user if password is wrong
        }
      } else {
        console.log(" No patient found with email:", email);
      }
    } catch (error) {
      console.log(" Error checking patient:", error.message);
    }

    // 2. If not found as patient, check if it's a doctor
    if (!user) {
      try {
        const doctor = await DoctorModel.findByEmail(email);
        if (doctor) {
          // Check if doctor is approved and available
          if (!doctor.status) {
            return res.status(401).json({
              success: false,
              message: "Doctor account is pending approval"
            });
          }
          
          // For now, use simple password validation for doctors
          // In the future, implement proper password hashing for doctors table
          let isPasswordValid = false;
          
          if (doctor.password_hash) {
            // If password_hash exists, use bcrypt comparison
            isPasswordValid = await DoctorModel.comparePassword(password, doctor.password_hash);
          } else {
            // Temporary: Allow login with default passwords for existing doctors
            // This matches the behavior of the working doctor login page
            isPasswordValid = (password === 'doctor123' || password === 'password123');
          }
          
          if (isPasswordValid) {
            user = doctor;
            userType = 'doctor';
            dashboardUrl = '/doctor-dashboard';
          }
        }
      } catch (error) {
        console.log("Error checking doctor:", error.message);
      }
    }

    // 3. If still not found, check if it's an admin
    if (!user) {
      try {
        const admin = await AdminModel.findByEmail(email);
        if (admin) {
          const isPasswordValid = await bcrypt.compare(password, admin.password);
          if (isPasswordValid) {
            // Check if admin is active
            if (!admin.is_active) {
              return res.status(401).json({
                success: false,
                message: "Admin account is deactivated"
              });
            }
            user = admin;
            userType = 'admin';
            dashboardUrl = '/dashboard.html';
          }
        }
      } catch (error) {
        console.log("Error checking admin:", error.message);
      }
    }

    // 4. If no user found or invalid credentials
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT token with user type
    const tokenPayload = {
      id: user.id,
      email: user.email,
      type: userType
    };

    // Add specific fields based on user type
    if (userType === 'patient') {
      tokenPayload.userID = user.id; // Maintain compatibility with existing middleware
      tokenPayload.name = user.first_name;
      tokenPayload.lastName = user.last_name;
      tokenPayload.mobile = user.mobile;
    } else if (userType === 'doctor') {
      tokenPayload.doctorId = user.id;
      tokenPayload.name = user.doctor_name;
      tokenPayload.department = user.department_id;
    } else if (userType === 'admin') {
      tokenPayload.adminId = user.id;
      tokenPayload.name = user.name;
      tokenPayload.role = user.role;
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "masai",
      { expiresIn: '24h' }
    );

    // Prepare response data
    const responseData = {
      success: true,
      message: "Login successful",
      token,
      userType,
      dashboardUrl,
      user: {}
    };

    // Add user-specific data
    if (userType === 'patient') {
      responseData.user = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        mobile: user.mobile
      };
    } else if (userType === 'doctor') {
      responseData.user = {
        id: user.id,
        name: user.doctor_name,
        email: user.email,
        qualifications: user.qualifications,
        experience: user.experience,
        city: user.city,
        departmentId: user.department_id,
        image: user.image,
        isAvailable: user.is_available
      };
    } else if (userType === 'admin') {
      responseData.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.is_active
      };
    }

    console.log(` ${userType} login successful:`, { email, userType, id: user.id });
    res.json(responseData);

  } catch (error) {
    console.error(" Unified login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication"
    });
  }
});

// Unified Registration Endpoint (for patients and doctors)
authRouter.post("/register", async (req, res) => {
  const { userType, ...userData } = req.body;
  
  console.log("🔍 Unified registration attempt:", { userType, email: userData.email });
  
  try {
    if (!userType || !['patient', 'doctor'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Valid userType (patient or doctor) is required"
      });
    }

    let createdUser = null;
    let dashboardUrl = null;

    if (userType === 'patient') {
      // Register as patient
      const { firstName, lastName, email, mobile, password } = userData;
      
      if (!firstName || !lastName || !email || !mobile || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required for patient registration"
        });
      }

      // Check if patient already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already registered as patient"
        });
      }

      const existingMobile = await UserModel.findByMobile(mobile);
      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile number already registered"
        });
      }

      // Create patient
      const hashedPassword = await bcrypt.hash(password, 10);
      createdUser = await UserModel.create({
        first_name: firstName,
        last_name: lastName,
        email,
        mobile,
        password: hashedPassword
      });

      dashboardUrl = '/patient-dashboard';

    } else if (userType === 'doctor') {
      // Register as doctor
      const { 
        doctorName, email, password, qualifications, experience, 
        phoneNo, city, departmentId, image 
      } = userData;
      
      if (!doctorName || !email || !password || !qualifications || !experience || !phoneNo || !city) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided for doctor registration"
        });
      }

      // Check if doctor already exists
      const existingDoctor = await DoctorModel.findByEmail(email);
      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message: "Email already registered as doctor"
        });
      }

      // Create doctor (will be pending approval)
      createdUser = await DoctorModel.create({
        doctor_name: doctorName,
        email,
        password, // Will be hashed in the model
        qualifications,
        experience,
        phone_no: phoneNo,
        city,
        department_id: departmentId,
        status: false, // Pending approval
        is_available: false,
        image: image || null
      });

      dashboardUrl = '/doctor-dashboard';
    }

    // Generate token for immediate login (except for pending doctors)
    let token = null;
    if (userType === 'patient' || (userType === 'doctor' && createdUser.status)) {
      const tokenPayload = {
        id: createdUser.id,
        email: createdUser.email,
        type: userType
      };

      if (userType === 'patient') {
        tokenPayload.userID = createdUser.id;
        tokenPayload.name = createdUser.first_name;
      } else if (userType === 'doctor') {
        tokenPayload.doctorId = createdUser.id;
        tokenPayload.name = createdUser.doctor_name;
      }

      token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET || "masai",
        { expiresIn: '24h' }
      );
    }

    const response = {
      success: true,
      message: userType === 'doctor' 
        ? "Doctor registration successful. Account pending approval." 
        : "Registration successful",
      userType,
      dashboardUrl: userType === 'doctor' && !createdUser.status ? null : dashboardUrl,
      user: {
        id: createdUser.id,
        email: createdUser.email
      }
    };

    if (token) {
      response.token = token;
    }

    if (userType === 'doctor' && !createdUser.status) {
      response.pendingApproval = true;
    }

    console.log(` ${userType} registration successful:`, { email: createdUser.email, id: createdUser.id });
    res.status(201).json(response);

  } catch (error) {
    console.error(" Unified registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration",
      error: error.message
    });
  }
});

// Get User Role Endpoint (for determining dashboard after login)
authRouter.get("/user-role", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "masai");
    
    const response = {
      success: true,
      userType: decoded.type,
      userId: decoded.id,
      email: decoded.email,
      dashboardUrl: decoded.type === 'patient' 
        ? '/patient-dashboard' 
        : decoded.type === 'doctor' 
        ? '/doctor-dashboard' 
        : '/dashboard.html'
    };

    // Add user-specific data
    if (decoded.type === 'patient') {
      response.name = decoded.name;
      response.lastName = decoded.lastName;
    } else if (decoded.type === 'doctor') {
      response.name = decoded.name;
      response.doctorId = decoded.doctorId;
    } else if (decoded.type === 'admin') {
      response.name = decoded.name;
      response.role = decoded.role;
    }

    res.json(response);

  } catch (error) {
    console.error("Error getting user role:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
});

// Logout endpoint (if needed for token blacklisting)
authRouter.post("/logout", (req, res) => {
  // Since we're using stateless JWT, logout is handled on client side
  // by removing the token from storage
  res.json({
    success: true,
    message: "Logout successful"
  });
});

module.exports = {
  authRouter
};
