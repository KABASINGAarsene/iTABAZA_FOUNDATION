const { supabase } = require("../config/db");

// Supabase table name
const TABLE_NAME = 'users';

// User model functions
const UserModel = {
  // Create a new user
  async create(userData) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([userData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Find user by email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find user by mobile
  async findByMobile(mobile) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('mobile', mobile)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find user by ID
  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get all users
  async findAll() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update user
  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Delete user
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
  UserModel,
};
