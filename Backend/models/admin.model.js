const { supabase } = require("../config/db");

// Supabase table name
const TABLE_NAME = 'admins';

// Admin model functions
const AdminModel = {
  // Create a new admin
  async create(adminData) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([adminData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Find admin by email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find admin by ID
  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get all admins
  async findAll() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update admin
  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Delete admin
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
  AdminModel,
};
