const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Simple in-memory test
const testAppointments = [];

// Simulate the appointment booking process
app.post('/test-appointment/create', (req, res) => {
  try {
    console.log('Received appointment data:', req.body);
    
    const appointmentData = {
      id: 'test-' + Date.now(),
      patient_first_name: req.body.patientFirstName || 'Test Patient',
      doc_first_name: req.body.doctorName || 'Test Doctor',
      age_of_patient: req.body.ageOfPatient || 30,
      gender: req.body.gender || 'male',
      address: req.body.address || 'Test Address',
      problem_description: req.body.problemDescription || 'Test problem',
      appointment_date: req.body.appointmentDate || new Date().toISOString().split('T')[0],
      appointment_time: req.body.appointmentTime || '10:00',
      consultation_type: req.body.consultationType || 'in-person',
      symptoms: req.body.symptoms || [],
      medical_history: req.body.medicalHistory || '',
      medications: req.body.medications || '',
      payment_status: req.body.paymentDetails && req.body.paymentDetails.transactionId ? true : false,
      payment_transaction_id: req.body.paymentDetails?.transactionId || null,
      payment_simcard_holder: req.body.paymentDetails?.simcardHolder || null,
      payment_phone_number: req.body.paymentDetails?.phoneNumber || null,
      payment_method: req.body.paymentDetails?.paymentMethod || null,
      payment_amount: req.body.paymentDetails?.amount || null,
      payment_currency: req.body.paymentDetails?.currency || 'RWF',
      created_at: new Date().toISOString()
    };
    
    // Add to in-memory storage
    testAppointments.push(appointmentData);
    
    console.log(' Appointment saved successfully:', appointmentData.id);
    console.log(' Total appointments in test database:', testAppointments.length);
    
    res.status(201).json({
      message: "Test appointment created successfully!",
      status: true,
      appointment: appointmentData,
      totalAppointments: testAppointments.length
    });
    
  } catch (error) {
    console.error(' Error creating test appointment:', error);
    res.status(500).json({
      message: "Error creating test appointment",
      error: error.message
    });
  }
});

// Get all test appointments
app.get('/test-appointment/all', (req, res) => {
  res.json({
    message: "All test appointments retrieved",
    count: testAppointments.length,
    appointments: testAppointments
  });
});

// Test payment flow
app.post('/test-payment/verify', (req, res) => {
  console.log('Payment verification test:', req.body);
  
  const { transactionId, simcardHolder, phoneNumber, paymentMethod, amount } = req.body;
  
  if (!transactionId || !simcardHolder || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: "Missing required payment fields"
    });
  }
  
  // Simulate payment verification
  const isValid = transactionId.length >= 5;
  
  res.json({
    success: isValid,
    message: isValid ? "Payment verified successfully" : "Invalid transaction ID",
    paymentDetails: {
      transactionId,
      simcardHolder,
      phoneNumber,
      paymentMethod,
      amount,
      verifiedAt: new Date().toISOString()
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(' Test appointment server running on port', PORT);
  console.log(' Test appointment creation: POST http://localhost:3001/test-appointment/create');
  console.log(' View all appointments: GET http://localhost:3001/test-appointment/all');
  console.log(' Test payment verification: POST http://localhost:3001/test-payment/verify');
});
