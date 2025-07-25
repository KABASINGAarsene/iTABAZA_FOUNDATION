const { authenticate } = require("../middlewares/authenticator.mw");
const { AppointmentModel } = require("../models/appointment.model");
const { DoctorModel } = require("../models/doctor.model");
const { UserModel } = require("../models/user.model");
require("dotenv").config();
const nodemailer = require("nodemailer");

const enhancedAppointmentRouter = require("express").Router();

// Enhanced appointment creation with all new fields
enhancedAppointmentRouter.post("/create/:doctorId", authenticate, async (req, res) => {
  let doctorId = req.params.doctorId;
  let patientId = req.body.userID || req.body.patientId || req.body.patient_id;
  let patientEmail = req.body.email;

  // Enhanced patient ID validation and recovery (similar to regular appointment router)
  if (!patientId) {
    console.log("[WARNING] Missing userID in enhanced booking. Attempting recovery...");
    console.log("[DEBUG] Enhanced booking request body:", JSON.stringify(req.body, null, 2));
    
    // Try to find patient by email as fallback
    if (req.body.email) {
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
        debug: "No userID, patientId, patient_id, or valid email found in enhanced booking request"
      });
    }
  }

  // Enhanced logging for debugging
  console.log('[DEBUG] Enhanced booking appointment:');
  console.log('  - Patient ID:', patientId);
  console.log('  - Doctor ID:', doctorId);
  console.log('  - Patient Email:', patientEmail);

  // Validate IDs
  if (!patientId || typeof patientId !== 'string' || patientId.length < 10) {
    return res.status(400).send({ msg: "Missing or invalid userID/patientId in request body" });
  }
  if (!doctorId || typeof doctorId !== 'string' || doctorId.length < 10) {
    return res.status(400).send({ msg: "Missing or invalid doctorId in request params" });
  }
  
  try {
    let docName = await DoctorModel.findById(doctorId);
    let patientName = await UserModel.findById(patientId);
    
    if (!docName) {
      return res.status(404).send({ msg: `Doctor doesn't exist` });
    }
    if (!patientName) {
      return res.status(404).send({ msg: `Patient doesn't exist` });
    }
    
    let docFirstName = docName.doctor_name;
    let patientFirstName = patientName.first_name;
    
    // Extract all the enhanced appointment data
    let { 
      ageOfPatient, 
      gender, 
      address, 
      problemDescription, 
      appointmentDate,
      appointmentTime,
      consultationType = 'in-person',
      symptoms = [],
      medicalHistory = '',
      medications = '',
      paymentDetails = {}
    } = req.body;
    
    console.log("Enhanced Appointment Create Console: ", {
      docFirstName, 
      patientFirstName, 
      patientEmail,
      consultationType,
      appointmentTime,
      symptoms
    });
    
    if (!docName.is_available) {
      return res.send({ msg: `${docFirstName} is currently unavailable` });
    }
    
    // Check if the slot is available
    if (appointmentDate && appointmentTime) {
      // For now, use default slots for any date (april_11 slots as template)
      // TODO: Implement dynamic date-based slot management
      const availableSlots = docName.april_11 || ['11-12', '2-3', '4-5', '7-8'];
      
      // Convert appointment time to slot format (e.g., "10:00" -> "10-11")
      const timeHour = parseInt(appointmentTime.split(':')[0]);
      let slotFormat = appointmentTime;
      
      // Map common times to slot formats
      const timeToSlotMap = {
        '10:00': '10-11',
        '11:00': '11-12', 
        '14:00': '2-3',
        '15:00': '3-4',
        '16:00': '4-5',
        '19:00': '7-8'
      };
      
      if (timeToSlotMap[appointmentTime]) {
        slotFormat = timeToSlotMap[appointmentTime];
      }
      
      if (!availableSlots.includes(slotFormat)) {
        return res.status(400).send({ 
          msg: `Selected time slot ${appointmentTime} (${slotFormat}) is not available. Available slots: ${availableSlots.join(', ')}` 
        });
      }
    }
    
    // Prepare enhanced appointment data
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
      appointment_time: appointmentTime,
      consultation_type: consultationType,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      medical_history: medicalHistory,
      medications: medications,
      status: false,
      payment_status: false,
      // Payment details
      payment_transaction_id: paymentDetails.transactionId || null,
      payment_simcard_holder: paymentDetails.simcardHolder || null,
      payment_phone_number: paymentDetails.phoneNumber || null,
      payment_method: paymentDetails.paymentMethod || null,
      payment_amount: paymentDetails.amount || null,
      payment_currency: paymentDetails.currency || 'RWF',
      patient_email: patientEmail,
      patient_phone: patientName.mobile
    };
    
    // Set payment status based on whether payment details are provided
    if (paymentDetails.transactionId && paymentDetails.simcardHolder) {
      appointmentData.payment_status = true;
    }
    
    const createdAppointment = await AppointmentModel.create(appointmentData);
    
    // TODO: Implement proper slot removal logic
    // Remove the booked slot from doctor's availability
    // Note: Currently disabled as it requires proper date-based slot management
    // if (appointmentDate && appointmentTime) {
    //   const dateKey = appointmentDate.toLowerCase().replace(/\s+/g, '_');
    //   const currentSlots = docName[dateKey] || [];
    //   const updatedSlots = currentSlots.filter(slot => slot !== appointmentTime);
    //   
    //   await DoctorModel.updateTimeSlots(doctorId, dateKey, updatedSlots);
    // }
    
    // Send enhanced confirmation email
    await sendEnhancedConfirmationEmail(patientEmail, patientFirstName, docFirstName, appointmentData);
    
    res.status(201).json({
      message: "Enhanced appointment has been created successfully. Check your email for confirmation.",
      status: true,
      appointment: createdAppointment,
      consultationType: consultationType
    });
    
  } catch (error) {
    console.error("Error creating enhanced appointment:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    res.status(500).send({ 
      msg: "Error in creating enhanced appointment", 
      error: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

// Enhanced appointment update (for payment details)
enhancedAppointmentRouter.patch("/update-payment/:appointmentId", authenticate, async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const { paymentDetails } = req.body;
    
    const updateData = {
      payment_transaction_id: paymentDetails.transactionId,
      payment_simcard_holder: paymentDetails.simcardHolder,
      payment_phone_number: paymentDetails.phoneNumber,
      payment_method: paymentDetails.paymentMethod,
      payment_amount: paymentDetails.amount,
      payment_currency: paymentDetails.currency || 'RWF',
      payment_status: true
    };
    
    const updatedAppointment = await AppointmentModel.update(appointmentId, updateData);
    
    res.status(200).json({
      message: "Payment details updated successfully",
      appointment: updatedAppointment
    });
    
  } catch (error) {
    console.error("Error updating payment details:", error);
    res.status(500).send({ msg: "Error updating payment details", error: error.message });
  }
});

// Get appointments by consultation type
enhancedAppointmentRouter.get("/by-type/:consultationType", authenticate, async (req, res) => {
  try {
    const consultationType = req.params.consultationType;
    const patientId = req.body.userID;
    
    const appointments = await AppointmentModel.findByTypeAndPatient(consultationType, patientId);
    
    res.status(200).json({
      message: `${consultationType} appointments retrieved successfully`,
      appointments: appointments
    });
    
  } catch (error) {
    console.error("Error getting appointments by type:", error);
    res.status(500).send({ msg: "Error getting appointments by type", error: error.message });
  }
});

// Get appointment statistics
enhancedAppointmentRouter.get("/stats", authenticate, async (req, res) => {
  try {
    const stats = await AppointmentModel.getStatistics();
    
    res.status(200).json({
      message: "Appointment statistics retrieved successfully",
      statistics: stats
    });
    
  } catch (error) {
    console.error("Error getting appointment statistics:", error);
    res.status(500).send({ msg: "Error getting appointment statistics", error: error.message });
  }
});

// Get available slots for a doctor on a specific date
enhancedAppointmentRouter.get("/available-slots/:doctorId/:date", async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).send({ msg: "Doctor not found" });
    }
    
    const dateKey = date.toLowerCase().replace(/\s+/g, '_');
    const availableSlots = doctor[dateKey] || [];
    
    // Filter out already booked slots
    const bookedAppointments = await AppointmentModel.findByDoctorAndDate(doctorId, date);
    const bookedSlots = bookedAppointments.map(apt => apt.appointment_time);
    const freeSlots = availableSlots.filter(slot => !bookedSlots.includes(slot));
    
    res.status(200).json({
      message: "Available slots retrieved successfully",
      availableSlots: freeSlots,
      totalSlots: availableSlots.length,
      bookedSlots: bookedSlots.length,
      freeSlots: freeSlots.length
    });
    
  } catch (error) {
    console.error("Error getting available slots:", error);
    res.status(500).send({ msg: "Error getting available slots", error: error.message });
  }
});

// Enhanced appointment details
enhancedAppointmentRouter.get("/details/:appointmentId", authenticate, async (req, res) => {
  try {
    const appointment = await AppointmentModel.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }
    
    // Get doctor details
    const doctor = await DoctorModel.findById(appointment.doctor_id);
    
    const enhancedDetails = {
      ...appointment,
      doctor: {
        name: doctor.doctor_name,
        qualifications: doctor.qualifications,
        experience: doctor.experience,
        phone: doctor.phone_no,
        city: doctor.city
      }
    };
    
    res.status(200).json({
      message: "Enhanced appointment details retrieved successfully",
      appointment: enhancedDetails
    });
    
  } catch (error) {
    console.error("Error getting appointment details:", error);
    res.status(500).send({ msg: "Error getting appointment details", error: error.message });
  }
});

// Helper function to send enhanced confirmation email
async function sendEnhancedConfirmationEmail(patientEmail, patientFirstName, docFirstName, appointmentData) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  const consultationTypeText = appointmentData.consultation_type === 'video-call' ? 'Video Call' : 'In-Person';
  const paymentStatus = appointmentData.payment_status ? 'Paid' : 'Pending';
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patientEmail,
    subject: `iTABAZA ${consultationTypeText} Appointment Confirmation`,
    html: `
    <!DOCTYPE html>
      <html>
        <head>
          <title>Appointment Confirmation</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333; padding: 20px;">
          <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #fff; border-collapse: collapse; border: 1px solid #ddd;">
            <tr>
              <td style="background-color: #0077c0; text-align: center; padding: 20px;">
                <h1 style="font-size: 28px; color: #fff; margin: 0;">iTABAZA</h1>
                <p style="color: #fff; margin: 5px 0 0 0;">Healthcare Excellence</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <h2 style="font-size: 24px; color: #0077c0; margin-top: 0;">Hello, ${patientFirstName}!</h2>
                <p style="margin-bottom: 20px;">Your ${consultationTypeText} appointment has been successfully booked.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #0077c0; margin-top: 0;">Appointment Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Doctor:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">Dr. ${docFirstName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${appointmentData.appointment_date}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${appointmentData.appointment_time}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${consultationTypeText}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Payment Status:</strong></td>
                      <td style="padding: 8px 0; color: ${paymentStatus === 'Paid' ? '#28a745' : '#ffc107'}; font-weight: bold;">${paymentStatus}</td>
                    </tr>
                  </table>
                </div>
                
                ${appointmentData.consultation_type === 'video-call' ? `
                <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #1976d2; margin-top: 0;">Video Call Instructions</h4>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>Ensure you have a stable internet connection</li>
                    <li>Find a quiet, well-lit environment</li>
                    <li>Have your medical history ready</li>
                    <li>Join the call 5 minutes before your appointment time</li>
                  </ul>
                </div>
                ` : `
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #2e7d32; margin-top: 0;">In-Person Visit Instructions</h4>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>Arrive 15 minutes before your appointment time</li>
                    <li>Bring your ID and any relevant medical documents</li>
                    <li>Wear a mask and follow COVID-19 protocols</li>
                    <li>Parking is available on-site</li>
                  </ul>
                </div>
                `}
                
                <p style="margin-bottom: 20px;">If you have any questions or need to reschedule, please contact our customer service team.</p>
                <p style="margin-bottom: 20px;">Thank you for choosing iTABAZA!</p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    Best regards,<br>
                    <strong>iTABAZA Team</strong><br>
                    Email: support@itabaza.com<br>
                    Phone: +250 123 456 789
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Enhanced confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending enhanced confirmation email:', error);
  }
}

module.exports = {
  enhancedAppointmentRouter,
}; 