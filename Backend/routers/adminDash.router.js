const { AdminModel } = require("../models/admin.model");
const { AppointmentModel } = require("../models/appointment.model");
const { DepartmentModel } = require("../models/department.model");
const { DoctorModel } = require("../models/doctor.model");
const { UserModel } = require("../models/user.model");
const bcrypt = require("bcrypt");
const adminDashRouter = require("express").Router();


adminDashRouter.post("/signin", async (req, res) => {
  let { email, password } = req.body;
  try {
    let admin = await AdminModel.findByEmail(email);
    if (admin) {
      // Compare password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (isPasswordValid) {
        res.send({
          message: "Login Successful",
        });
      } else {
        res.send({
          message: "Wrong Admin Password",
        });
      }
    } else {
      res.send({
        message: "Wrong Admin Email",
      });
    }
  } catch (e) {
    res.send({ msg: "Error in Login" + e });
  }
});

adminDashRouter.post('/signup',async(req,res)=>{
  let { name, email, password } = req.body;
  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const adminData = {
      name,
      email,
      password: hashedPassword
    };
    
    const admin = await AdminModel.create(adminData);
    res.send('Admin Signup Successful');
  } catch (error) {
    console.error("Admin signup error:", error);
    res.status(500).send({ msg: "Error in Admin Signup", error: error.message });
  }
})

//!! ALL DETAILS ------------------------------->
adminDashRouter.get("/all", async (req, res) => {
  try {
    // Get all users
    const usersRegistered = await UserModel.findAll();
    
    // Get all doctors
    const allDoctors = await DoctorModel.findAll();
    const docApproved = allDoctors.filter(doctor => doctor.status === true);
    const docPending = allDoctors.filter(doctor => doctor.status === false);
    
    // Get all appointments
    const allAppointments = await AppointmentModel.findAll();
    const totalAppointments = allAppointments.length;
    const totalPendingAppointments = allAppointments.filter(app => app.status === false).length;
    
    res.status(200).json({
      usersRegistered,
      docApproved,
      docPending,
      totalAppointments,
      totalPendingAppointments
    });
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).send({ msg: "Error getting dashboard data", error: error.message });
  }
});

// Get all pending appointments
adminDashRouter.get("/allPending", async (req, res) => {
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
adminDashRouter.delete("/reject/:appointmentId", async (req, res) => {
  try {
    await AppointmentModel.delete(req.params.appointmentId);
    res.status(200).send({ msg: "Appointment rejected successfully" });
  } catch (error) {
    console.error("Error rejecting appointment:", error);
    res.status(500).send({ msg: "Error rejecting appointment", error: error.message });
  }
});

// Approve appointment
adminDashRouter.patch("/approve/:appointmentId", async (req, res) => {
  try {
    const appointment = await AppointmentModel.update(req.params.appointmentId, {
      status: true
    });
    res.status(200).send({ msg: "Appointment approved successfully", appointment });
  } catch (error) {
    console.error("Error approving appointment:", error);
    res.status(500).send({ msg: "Error approving appointment", error: error.message });
  }
});

// Get user statistics
adminDashRouter.get("/userStats", async (req, res) => {
  try {
    const users = await UserModel.findAll();
    const totalUsers = users.length;
    const recentUsers = users.slice(0, 5); // Get last 5 users
    
    res.status(200).json({
      totalUsers,
      recentUsers
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).send({ msg: "Error getting user statistics", error: error.message });
  }
});

// Get doctor statistics
adminDashRouter.get("/doctorStats", async (req, res) => {
  try {
    const doctors = await DoctorModel.findAll();
    const totalDoctors = doctors.length;
    const approvedDoctors = doctors.filter(doctor => doctor.status === true).length;
    const pendingDoctors = doctors.filter(doctor => doctor.status === false).length;
    const availableDoctors = doctors.filter(doctor => doctor.is_available === true).length;
    
    res.status(200).json({
      totalDoctors,
      approvedDoctors,
      pendingDoctors,
      availableDoctors
    });
  } catch (error) {
    console.error("Error getting doctor stats:", error);
    res.status(500).send({ msg: "Error getting doctor statistics", error: error.message });
  }
});

// Get appointment statistics
adminDashRouter.get("/appointmentStats", async (req, res) => {
  try {
    const stats = await AppointmentModel.getStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error getting appointment stats:", error);
    res.status(500).send({ msg: "Error getting appointment statistics", error: error.message });
  }
});

// Get all appointments with complete payment details (Admin only)
adminDashRouter.get("/appointments", async (req, res) => {
  try {
    const appointments = await AppointmentModel.findAll();
    
    // Enhance appointments with doctor and patient details
    const enhancedAppointments = [];
    
    for (const appointment of appointments) {
      try {
        const doctor = await DoctorModel.findById(appointment.doctor_id);
        const patient = await UserModel.findById(appointment.patient_id);
        
        const enhancedAppointment = {
          ...appointment,
          doctor_details: doctor ? {
            name: doctor.doctor_name,
            qualifications: doctor.qualifications,
            experience: doctor.experience,
            phone: doctor.phone_no,
            city: doctor.city,
            department_id: doctor.department_id
          } : null,
          patient_details: patient ? {
            name: `${patient.first_name} ${patient.last_name}`,
            email: patient.email,
            mobile: patient.mobile
          } : null,
          payment_details: {
            transaction_id: appointment.payment_transaction_id,
            simcard_holder: appointment.payment_simcard_holder,
            owner_name: appointment.payment_owner_name,
            phone_number: appointment.payment_phone_number,
            method: appointment.payment_method,
            amount: appointment.payment_amount,
            currency: appointment.payment_currency,
            status: appointment.payment_status
          }
        };
        
        enhancedAppointments.push(enhancedAppointment);
      } catch (detailError) {
        console.error(`Error getting details for appointment ${appointment.id}:`, detailError);
        enhancedAppointments.push(appointment); // Add without enhancement if details fail
      }
    }
    
    // Calculate additional statistics
    const totalRevenue = appointments
      .filter(app => app.payment_status && app.payment_amount)
      .reduce((sum, app) => sum + parseFloat(app.payment_amount || 0), 0);
    
    const paymentMethodStats = appointments
      .filter(app => app.payment_method)
      .reduce((acc, app) => {
        acc[app.payment_method] = (acc[app.payment_method] || 0) + 1;
        return acc;
      }, {});
    
    const consultationTypeStats = appointments
      .reduce((acc, app) => {
        const type = app.consultation_type || 'in-person';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
    
    res.status(200).json({
      message: "All appointments with payment details retrieved successfully",
      appointments: enhancedAppointments,
      statistics: {
        total_appointments: appointments.length,
        pending_appointments: appointments.filter(app => app.status === false).length,
        completed_appointments: appointments.filter(app => app.status === true).length,
        paid_appointments: appointments.filter(app => app.payment_status === true).length,
        unpaid_appointments: appointments.filter(app => app.payment_status === false).length,
        total_revenue: totalRevenue,
        payment_method_stats: paymentMethodStats,
        consultation_type_stats: consultationTypeStats
      }
    });
  } catch (error) {
    console.error("Error getting appointments with payment details:", error);
    res.status(500).send({ msg: "Error getting appointments with payment details", error: error.message });
  }
});

// Real-time dashboard updates
adminDashRouter.get("/realtime", async (req, res) => {
  try {
    const { supabase } = require("../config/db");
    
    // Set up multiple real-time subscriptions
    const subscription = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        (payload) => {
          console.log('User change:', payload);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'doctors' }, 
        (payload) => {
          console.log('Doctor change:', payload);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' }, 
        (payload) => {
          console.log('Appointment change:', payload);
        }
      )
      .subscribe();

    res.json({ message: "Real-time dashboard subscription set up" });
  } catch (error) {
    res.status(500).send({ msg: "Error setting up real-time", error: error.message });
  }
});

module.exports = {
  dashboardRouter: adminDashRouter,
};
