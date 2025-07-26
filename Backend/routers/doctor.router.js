const { DoctorModel } = require("../models/doctor.model");
const doctorRouter = require("express").Router();

// get all doctors
doctorRouter.get("/allDoctor", async (req, res) => {
  try {
    const doctors = await DoctorModel.findAll();
    res.status(200).send({ total: doctors.length, doctor: doctors });
  } catch (error) {
    console.error("Error getting doctors:", error);
    res.status(500).send({ msg: "Error in getting doctor info.." });
  }
});

// get only available doctors (status: true and is_available: true)
doctorRouter.get("/availableDoctors", async (req, res) => {
  try {
    const doctors = await DoctorModel.findAvailable();
    res.status(200).send({ total: doctors.length, doctor: doctors });
  } catch (error) {
    console.error("Error getting available doctors:", error);
    res.status(500).send({ msg: "Error in getting available doctor info.." });
  }
});

// Add a Doctor
doctorRouter.post("/addDoctor", async (req, res) => {
  let {
    doctorName,
    email,
    password,
    qualifications,
    experience,
    phoneNo,
    city,
    departmentId,
    status,
    image,
    isAvailable,
  } = req.body;
  
  try {
    // Validate required fields
    if (!password) {
      return res.status(400).send({ msg: "Password is required for doctor account" });
    }
    
    const doctorData = {
      doctor_name: doctorName,
      email,
      password, // This will be hashed in the model
      qualifications,
      experience,
      phone_no: phoneNo,
      city,
      department_id: departmentId,
      status: status !== undefined ? status : true,
      image,
      is_available: isAvailable !== undefined ? isAvailable : true,
      april_11: ["11-12", "2-3", "4-5", "7-8"],
      april_12: ["11-12", "2-3", "4-5", "7-8"],
      april_13: ["11-12", "2-3", "4-5", "7-8"],
    };

    const doctor = await DoctorModel.create(doctorData);
    res.status(201).send({ msg: "Doctor has been created and is now available for booking", doctor });
  } catch (error) {
    console.error("Error creating doctor:", error);
    res.status(500).send({ 
      msg: "Error in creating doctor due to Non unique email/mobile",
      error: error.message 
    });
  }
});

// SEARCH BY NAME
doctorRouter.get("/search", async (req, res) => {
  let query = req.query;
  try {
    const result = await DoctorModel.searchByName(query.q);
    res.send(result);
  } catch (err) {
    console.error("Error searching doctors:", err);
    res.status(500).send({ "err in getting doctor details": err.message });
  }
});

// DOCTORS BY DEPARTMENT ID
doctorRouter.get("/allDoctor/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const doctors = await DoctorModel.findByDepartment(id);
    if (doctors.length === 0) {
      return res.status(200).send({ msg: "This Department have no doctors" });
    }
    res.status(200).send({ total: doctors.length, doctor: doctors });
  } catch (error) {
    console.error("Error getting doctors by department:", error);
    res.status(500).send({ msg: "Error in getting Dr. info.." });
  }
});

// AVAILABLE DOCTORS BY DEPARTMENT ID
doctorRouter.get("/availableDoctors/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const doctors = await DoctorModel.findAvailableByDepartment(id);
    if (doctors.length === 0) {
      return res.status(200).send({ msg: "This Department have no available doctors" });
    }
    res.status(200).send({ total: doctors.length, doctor: doctors });
  } catch (error) {
    console.error("Error getting available doctors by department:", error);
    res.status(500).send({ msg: "Error in getting available Dr. info.." });
  }
});

// DELETE A DOCTOR
doctorRouter.delete("/removeDoctor/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const isDoctorPresent = await DoctorModel.findById(id);
    if (!isDoctorPresent) {
      return res.status(404).send({ msg: "Doctor not found" });
    }
    
    await DoctorModel.delete(id);
    res.status(200).send({ msg: "Doctor deleted" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).send({ msg: "Error in deleting the doctor" });
  }
});

// DOCTOR PENDING FOR APPROVAL
doctorRouter.get("/docPending", async (req, res) => {
  try {
    const docPending = await DoctorModel.findPending();
    if (!docPending || docPending.length === 0) {
      return res.send({ msg: "No Doc Pending for Approval" });
    }
    res.status(200).send({ msg: "Doc Pending", docPending });
  } catch (error) {
    console.error("Error getting pending doctors:", error);
    res.status(500).send({ msg: "Error getting pending doctors" });
  }
});

// UPDATE THE DOCTOR STATUS
doctorRouter.patch("/updateDoctorStatus/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const isDoctorPresent = await DoctorModel.findById(id);
    if (!isDoctorPresent) {
      return res.status(404).send({ msg: "Doctor not found, check Id" });
    }
    
    if (req.body.status === true) {
      await DoctorModel.update(id, { status: true });
      res.status(200).send({ msg: "Doctor Application Approved" });
    } else if (req.body.status === false) {
      await DoctorModel.delete(id);
      res.status(200).send({ msg: "Doctor Application Rejected" });
    }
  } catch (error) {
    console.error("Error updating doctor status:", error);
    res.status(500).send({ msg: "Server error while updating the doctor Status" });
  }
});

// Update the availability status of a doctor by ID
doctorRouter.patch("/isAvailable/:doctorId", async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // Check if the doctor with the given ID exists
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found, please check the ID" });
    }

    // Update the availability status of the doctor
    const updatedDoctor = await DoctorModel.update(doctorId, {
      is_available: req.body.isAvailable,
    });
    
    res.json({
      msg: "Doctor's status has been updated",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(500).json({ msg: "Server error while updating the doctor status" });
  }
});

// Doctor login endpoint
doctorRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Find doctor by email
    const doctor = await DoctorModel.findByEmail(email);
    
    if (!doctor) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Check if doctor is approved and available
    if (!doctor.status) {
      return res.status(401).json({ 
        success: false, 
        message: "Doctor account is pending approval" 
      });
    }

    // Verify password
    if (!doctor.password_hash) {
      return res.status(401).json({ 
        success: false, 
        message: "Doctor account needs password setup. Contact admin." 
      });
    }
    
    const isPasswordValid = await DoctorModel.comparePassword(password, doctor.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: doctor.id, 
        email: doctor.email, 
        type: 'doctor' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: "Login successful",
      token: token,
      doctor: {
        id: doctor.id,
        doctor_name: doctor.doctor_name,
        email: doctor.email,
        qualifications: doctor.qualifications,
        experience: doctor.experience,
        city: doctor.city,
        department_id: doctor.department_id,
        image: doctor.image
      }
    });
    
  } catch (error) {
    console.error("Doctor login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// Middleware to verify doctor authentication
const verifyDoctorAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.type !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Invalid token type' });
    }

    req.doctor = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Get appointments for a specific doctor (with authentication)
doctorRouter.get("/appointments/:doctorId", verifyDoctorAuth, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Verify the doctor can only access their own appointments
    // Convert both to strings for comparison
    if (String(req.doctor.id) !== String(doctorId)) {
      console.log(`Access denied: Doctor ID ${req.doctor.id} trying to access appointments for ${doctorId}`);
      return res.status(403).json({ 
        success: false, 
        message: "You can only access your own appointments" 
      });
    }
    
    // Import appointment model
    const { AppointmentModel } = require("../models/appointment.model");
    
    // Get appointments for this doctor
    const appointments = await AppointmentModel.findByDoctorId(doctorId);
    
    res.json({
      success: true,
      total: appointments.length,
      appointments: appointments
    });
    
  } catch (error) {
    console.error("Error getting doctor appointments:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching appointments" 
    });
  }
});

// Get doctor dashboard statistics
doctorRouter.get("/stats/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Import appointment model
    const { AppointmentModel } = require("../models/appointment.model");
    
    // Get all appointments for this doctor
    const appointments = await AppointmentModel.findByDoctorId(doctorId);
    
    // Calculate statistics
    const totalAppointments = appointments.length;
    const pendingAppointments = appointments.filter(app => !app.status).length;
    const completedAppointments = appointments.filter(app => app.status).length;
    
    // Get today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(app => 
      app.appointment_date === today
    ).length;
    
    // Calculate unique patients
    const uniquePatients = new Set(appointments.map(app => app.patient_id)).size;
    
    // Calculate revenue (if payment_amount exists)
    const totalRevenue = appointments
      .filter(app => app.payment_status && app.payment_amount)
      .reduce((sum, app) => sum + parseFloat(app.payment_amount || 0), 0);
    
    res.json({
      success: true,
      stats: {
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        todayAppointments,
        uniquePatients,
        totalRevenue: totalRevenue.toFixed(2)
      }
    });
    
  } catch (error) {
    console.error("Error getting doctor stats:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching statistics" 
    });
  }
});

// Alternative route without authentication for testing
doctorRouter.get("/appointments-test/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Import appointment model
    const { AppointmentModel } = require("../models/appointment.model");
    
    // Get appointments for this doctor
    const appointments = await AppointmentModel.findByDoctorId(doctorId);
    
    res.json({
      success: true,
      total: appointments.length,
      appointments: appointments
    });
    
  } catch (error) {
    console.error("Error getting doctor appointments:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching appointments" 
    });
  }
});

module.exports = {
  doctorRouter,
};
