const { supabase } = require("../config/db");
const bcrypt = require('bcrypt');

// Supabase table name
const TABLE_NAME = 'doctors';

// Doctor model functions
const DoctorModel = {
  // Hash password
  async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  },

  // Compare password
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Create a new doctor
  async create(doctorData) {
    // Hash password if provided
    if (doctorData.password) {
      doctorData.password_hash = await this.hashPassword(doctorData.password);
      delete doctorData.password; // Remove plain password
    }
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([doctorData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Find doctor by ID
  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find doctor by email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get all doctors
  async findAll() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get only available doctors (status: true and is_available: true)
  async findAvailable() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('status', true)
      .eq('is_available', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get doctors by department
  async findByDepartment(departmentId) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('department_id', departmentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get available doctors by department
  async findAvailableByDepartment(departmentId) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('department_id', departmentId)
      .eq('status', true)
      .eq('is_available', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Search doctors by name
  async searchByName(name) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .ilike('doctor_name', `%${name}%`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get pending doctors
  async findPending() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('status', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update doctor
  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Delete doctor
  async delete(id) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Update time slots
  async updateTimeSlots(id, date, slots) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ [date]: slots })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

module.exports = {
  DoctorModel,
};
