const { supabase } = require("../config/db");

// Supabase table name
const TABLE_NAME = 'patients';

// Patient model functions
const PatientModel = {
  // Create a new patient
  async create(patientData) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([patientData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Find patient by ID
  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find patient by email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find patient by phone
  async findByPhone(phone) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get all patients
  async findAll() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update patient
  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Delete patient
  async delete(id) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

module.exports = {
  PatientModel,
};
