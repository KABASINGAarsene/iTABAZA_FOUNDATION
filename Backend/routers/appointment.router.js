const { authenticate } = require("../middlewares/authenticator.mw");
const { AppointmentModel } = require("../models/appointment.model");
const { DoctorModel } = require("../models/doctor.model");
const { UserModel } = require("../models/user.model");
require("dotenv").config();
const nodemailer = require("nodemailer");

const appointmentRouter = require("express").Router();

//!! User Side OPERATION------------------------------>
//  Get All Appointments for a Particular Patient
appointmentRouter.get("/allApp", authenticate, async (req, res) => {
  let id = req.body.userID;
  console.log(id);
  try {
    const appointments = await AppointmentModel.findByPatientId(id);
    res.status(200).json({
      message: "All appointments By A Patient retrieved successfully",
      appointments: appointments,
    });
  } catch (error) {
    console.error("Error getting appointments:", error);
    res.status(501).send({ msg: "Error in Getting All Appointments By a Patient", error: error.message });
  }
});

// Details according to Appointment ID
appointmentRouter.get("/getApp/:appointmentId", authenticate, async (req, res) => {
  try {
    const appointment = await AppointmentModel.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }
    res.status(200).json({
      message: "Particular Appointments Details",
      appointment: appointment,
    });
  } catch (error) {
    console.error("Error getting appointment:", error);
    res.status(501).send({ msg: "Error in Getting Appointment Details", error: error.message });
  }
});

// !! Check Slots
appointmentRouter.post("/checkSlot/:doctorId", async (req, res) => {
  let { date, slotTime } = req.body;
  let doctorId = req.params.doctorId;
  console.log(date, slotTime);
  try {
    let docName = await DoctorModel.findById(doctorId);
    if (!docName) {
      return res.status(404).send({ msg: `Doctor donot exists` });
    }
    if (!docName.is_available) {
      return res.send({
        msg: `${docName.doctor_name} is not available currently`,
      });
    }

    // Check time slots based on date
    const dateKey = date.toLowerCase().replace(/\s+/g, '_');
    const availableSlots = docName[dateKey] || [];
    
    if (availableSlots.includes(slotTime)) {
      res.send({ msg: "Slot Available", available: true });
    } else {
      res.send({ msg: "Slot Not Available", available: false });
    }
  } catch (error) {
    console.error("Error checking slot:", error);
    res.send({ msg: "Error in Check Slot Router", error: error.message });
  }
});

// !! Appointment Book
appointmentRouter.post("/create/:doctorId", authenticate, async (req, res) => {
  let doctorId = req.params.doctorId;
  let patientId = req.body.userID;
  
  // Enhanced patient ID validation and recovery
  if (!patientId) {
    console.log("[WARNING] Missing userID in request body. Attempting recovery...");
    console.log("[DEBUG] Full request body:", JSON.stringify(req.body, null, 2));
    
    // Try to get patient ID from alternative sources
    if (req.body.patientId) {
      patientId = req.body.patientId;
      console.log("[RECOVERY] Found patientId in request body:", patientId);
    } else if (req.body.patient_id) {
      patientId = req.body.patient_id;
      console.log("[RECOVERY] Found patient_id in request body:", patientId);
    } else if (req.body.email) {
      // Try to find patient by email as last resort
      console.log("[RECOVERY] Attempting to find patient by email:", req.body.email);
      try {
        const patient = await UserModel.findByEmail(req.body.email);
        if (patient) {
          patientId = patient.id;
          console.log("[RECOVERY] Found patient by email, ID:", patientId);
        }
      } catch (emailError) {
        console.log("[ERROR] Failed to find patient by email:", emailError.message);
      }
    }
    
    if (!patientId) {
      return res.status(400).send({ 
        msg: "Missing patient identification. Please log in again or contact support.",
        debug: "No userID, patientId, patient_id, or valid email found in request"
      });
    }
  }
  
  let patientEmail = req.body.email;

  // Enhanced debug logging
  console.log("[DEBUG] Enhanced booking request:");
  console.log("  - Doctor ID:", doctorId);
  console.log("  - Patient ID:", patientId);
  console.log("  - Patient Email:", patientEmail);
  console.log("  - Request body keys:", Object.keys(req.body));
  
  try {
    let docName = await DoctorModel.findById(doctorId);
    let patientName = await UserModel.findById(patientId);
    
    if (!docName) {
      return res.status(404).send({ msg: `Doctor donot exists` });
    }
    if (!patientName) {
      return res.status(404).send({ msg: `Patient donot exists` });
    }
    
    let docFirstName = docName.doctor_name;
    let patientFirstName = patientName.first_name;
    console.log("Appointment Create Console: ", docFirstName, patientFirstName, patientEmail);
    
    let { ageOfPatient, gender, address, problemDescription, appointmentDate, slotTime, paymentDetails = {} } = req.body;
    console.log(req.body);
    
    if (!docName.is_available) {
      return res.send({ msg: `${docFirstName} is currently unavailable` });
    }
    
    const appointmentData = {
      patient_id: patientId,
      doctor_id: doctorId,
      patient_first_name: patientFirstName,
      doc_first_name: docFirstName,
      age_of_patient: ageOfPatient,
      gender,
      address,
      problem_description: problemDescription,
      appointment_date: appointmentDate,
      slot_time: slotTime,
      status: 'pending',
      payment_status: Boolean(paymentDetails.transactionId),
      // Payment details for Rwanda mobile money
      payment_transaction_id: paymentDetails.transactionId || null,
      payment_simcard_holder: paymentDetails.simcardHolder || null,
      payment_owner_name: paymentDetails.ownerName || null,
      payment_phone_number: paymentDetails.phoneNumber || null,
      payment_method: paymentDetails.paymentMethod || null,
      payment_amount: paymentDetails.amount || null,
      payment_currency: paymentDetails.currency || 'RWF'
    };
    
    const createdAppointment = await AppointmentModel.create(appointmentData);
    
    // !!-NODE MAILER-//
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: patientEmail,
      subject: "iTABAZA Appointment Confirm",
      html: `
      <!DOCTYPE html>
        <html>
          <head>
            <title>Example Email Template</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 18px; line-height: 1.5; color: #333; padding: 20px;">
            <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-collapse: collapse;">
              <tr>
                <td style="background-color: #0077c0; text-align: center; padding: 10px;">
                  <h1 style="font-size: 28px; color: #fff; margin: 0;">iTABAZA</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px;">
                  <h2 style="font-size: 24px; color: #0077c0; margin-top: 0;">Hello, [${patientFirstName}]</h2>
                  <h5 style="margin-bottom: 20px;">Thank you for your recent appointment with ${docFirstName}. Your appointment has been booked for [${problemDescription}] on [${appointmentDate}]</h5>
                  <p style="margin-bottom: 20px;">If you do have any issues, please don't hesitate to contact our customer service team. We're always happy to help.</p>
                  <p style="margin-bottom: 20px;">Thank you for choosing iTABAZA Services</p>
                  <p style="margin-bottom: 0;">Best regards,</p>
                  <p style="margin-bottom: 20px;">iTABAZA</p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };
    
    transporter
      .sendMail(mailOptions)
      .then((info) => {
        res.status(201).json({
          message: "Appointment has been created , Check Your Mail",
          status: true,
          appointment: createdAppointment
        });
      })
      .catch((e) => {
        console.log(e);
        return res.status(500).json({ message: "Error Sending Mail" });
      });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).send({ msg: "Error in created appointment", error: error.message });
  }
});

//!! Delete Slot
appointmentRouter.post("/deleteSlot/:doctorId", async (req, res) => {
  let { date, slotTime } = req.body;
  let doctorId = req.params.doctorId;
  
  try {
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ msg: "Doctor not found" });
    }
    
    const dateKey = date.toLowerCase().replace(/\s+/g, '_');
    const currentSlots = doctor[dateKey] || [];
    const updatedSlots = currentSlots.filter(slot => slot !== slotTime);
    
    await DoctorModel.updateTimeSlots(doctorId, dateKey, updatedSlots);
    res.status(200).send({ msg: "Slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).send({ msg: "Error deleting slot", error: error.message });
  }
});

// Cancel appointment
appointmentRouter.delete("/cancel/:appointmentId", authenticate, async (req, res) => {
  try {
    const appointment = await AppointmentModel.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).send({ msg: "Appointment not found" });
    }
    
    await AppointmentModel.delete(req.params.appointmentId);
    res.status(200).send({ msg: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).send({ msg: "Error cancelling appointment", error: error.message });
  }
});

// Reschedule appointment
appointmentRouter.patch("/reschedule/:appointmentId", authenticate, async (req, res) => {
  try {
    const { appointmentDate } = req.body;
    const appointment = await AppointmentModel.update(req.params.appointmentId, {
      appointment_date: appointmentDate
    });
    
    res.status(200).send({ msg: "Appointment rescheduled successfully", appointment });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    res.status(500).send({ msg: "Error rescheduling appointment", error: error.message });
  }
});

//!! Admin Side OPERATION------------------------------>
// Get appointments by doctor ID
appointmentRouter.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const appointments = await AppointmentModel.findByDoctorId(doctorId);
    
    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No appointments found for this doctor",
        data: [],
        count: 0
      });
    }
    
    // Calculate statistics
    const today = new Date().toISOString().split('T')[0];
    const stats = {
      total: appointments.length,
      today: appointments.filter(app => app.appointment_date === today).length,
      pending: appointments.filter(app => app.status === 'pending').length,
      confirmed: appointments.filter(app => app.status === 'confirmed').length,
      completed: appointments.filter(app => app.status === 'completed').length,
      cancelled: appointments.filter(app => app.status === 'cancelled').length
    };
    
    res.status(200).json({
      success: true,
      message: "Doctor appointments retrieved successfully",
      data: appointments,
      stats: stats,
      count: appointments.length
    });
  } catch (error) {
    console.error("Error getting doctor appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error getting doctor appointments",
      error: error.message
    });
  }
});

// Get all appointments (Admin)
appointmentRouter.get("/all", async (req, res) => {
  try {
    const appointments = await AppointmentModel.findAll();
    res.status(200).json({
      message: "All appointments retrieved successfully",
      appointments: appointments,
    });
  } catch (error) {
    console.error("Error getting all appointments:", error);
    res.status(500).send({ msg: "Error getting all appointments", error: error.message });
  }
});

// Get pending appointments
appointmentRouter.get("/allPending", async (req, res) => {
  try {
    const appointments = await AppointmentModel.findPending();
    res.status(200).json({
      message: "Pending appointments retrieved successfully",
      appointments: appointments,
    });
  } catch (error) {
    console.error("Error getting pending appointments:", error);
    res.status(500).send({ msg: "Error getting pending appointments", error: error.message });
  }
});

// Reject appointment
appointmentRouter.delete("/reject/:appointmentId", async (req, res) => {
  try {
    await AppointmentModel.delete(req.params.appointmentId);
    res.status(200).send({ msg: "Appointment rejected successfully" });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    res.status(500).send({ msg: "Error rejecting appointment", error: error.message });
  }
});

// Approve appointment
appointmentRouter.patch("/approve/:appointmentId", async (req, res) => {
  try {
    const appointment = await AppointmentModel.update(req.params.appointmentId, {
      status: 'confirmed'
    });
    res.status(200).send({ msg: "Appointment approved successfully", appointment });
  } catch (error) {
    console.error("Error approving appointment:", error);
    res.status(500).send({ msg: "Error approving appointment", error: error.message });
  }
});

// Real-time appointment updates
appointmentRouter.get("/realtime", async (req, res) => {
  try {
    const { supabase } = require("../config/db");
    
    const subscription = supabase
      .channel('appointments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' }, 
        (payload) => {
          console.log('Appointment change:', payload);
        }
      )
      .subscribe();

    res.json({ message: "Real-time appointment subscription set up" });
  } catch (error) {
    res.status(500).send({ msg: "Error setting up real-time", error: error.message });
  }
});

// Create a pending appointment (no authentication required)
appointmentRouter.post("/create-pending", async (req, res) => {
  try {
    const appointmentData = req.body;
    
    // Enhanced debug logging
    console.log('[DEBUG] Create-pending request body:', JSON.stringify(appointmentData, null, 2));

    // Ensure status and payment_status are set for pending
    appointmentData.status = 'pending';
    appointmentData.payment_status = false;
    
    // Enhanced patient ID resolution with multiple fallback strategies
    let patientId = appointmentData.patient_id || appointmentData.patientId || appointmentData.userID;
    
    if (!patientId) {
      console.log('[DEBUG] No direct patient ID found. Attempting resolution...');
      
      // Strategy 1: Find by email
      if (appointmentData.patient_email || appointmentData.email) {
        const email = appointmentData.patient_email || appointmentData.email;
        console.log('[DEBUG] Trying to find patient by email:', email);
        try {
          const patient = await UserModel.findByEmail(email);
          if (patient) {
            patientId = patient.id;
            appointmentData.patient_id = patientId;
            console.log('[SUCCESS] Found patient ID by email:', patientId);
            
            // Also populate other patient details if missing
            if (!appointmentData.patient_first_name && patient.first_name) {
              appointmentData.patient_first_name = patient.first_name;
            }
            if (!appointmentData.patient_phone && patient.mobile) {
              appointmentData.patient_phone = patient.mobile;
            }
          } else {
            console.log('[WARNING] No patient found with email:', email);
          }
        } catch (emailError) {
          console.log('[ERROR] Error finding patient by email:', emailError.message);
        }
      }
      
      // Strategy 2: Find by phone number
      if (!patientId && (appointmentData.patient_phone || appointmentData.phone)) {
        const phone = appointmentData.patient_phone || appointmentData.phone;
        console.log('[DEBUG] Trying to find patient by phone:', phone);
        try {
          const patient = await UserModel.findByMobile(phone);
          if (patient) {
            patientId = patient.id;
            appointmentData.patient_id = patientId;
            console.log('[SUCCESS] Found patient ID by phone:', patientId);
            
            // Populate other details if missing
            if (!appointmentData.patient_first_name && patient.first_name) {
              appointmentData.patient_first_name = patient.first_name;
            }
            if (!appointmentData.patient_email && patient.email) {
              appointmentData.patient_email = patient.email;
            }
          } else {
            console.log('[WARNING] No patient found with phone:', phone);
          }
        } catch (phoneError) {
          console.log('[ERROR] Error finding patient by phone:', phoneError.message);
        }
      }
      
      // Strategy 3: Find by name and other details (last resort)
      if (!patientId && appointmentData.patient_first_name) {
        console.log('[DEBUG] Attempting to find patient by name and details...');
        try {
          // This is a more complex search - we could implement a fuzzy match
          // For now, just log that we attempted this strategy
          console.log('[INFO] Name-based search not implemented, patient_id will be null');
        } catch (nameError) {
          console.log('[ERROR] Error in name-based search:', nameError.message);
        }
      }
    } else {
      appointmentData.patient_id = patientId;
      console.log('[SUCCESS] Patient ID already available:', patientId);
    }
    
    // Final validation and warning
    if (!appointmentData.patient_id) {
      console.log('[WARNING] Creating appointment without patient_id');
      console.log('[WARNING] Available data keys:', Object.keys(appointmentData));
      console.log('[WARNING] This appointment will need manual patient linking');
      
      // Log that this appointment needs manual attention
      console.log('[INFO] This appointment will require manual patient linking in admin panel');
    }

    // Save to database
    const created = await AppointmentModel.create(appointmentData);
    
    console.log('[DEBUG] Created appointment:', {
      id: created.id,
      patient_id: created.patient_id,
      doctor_id: created.doctor_id,
      patient_email: created.patient_email
    });

    res.status(201).json({
      message: 'Appointment created and pending payment.',
      appointment: created
    });
  } catch (error) {
    console.error('Error creating pending appointment:', error);
    res.status(500).json({ message: 'Failed to create appointment', error: error.message });
  }
});

module.exports = {
  appointmentRouter,
};