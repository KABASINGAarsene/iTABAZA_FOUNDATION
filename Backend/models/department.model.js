const { supabase } = require("../config/db");

// Supabase table name
const TABLE_NAME = 'departments';

// Department model functions
const DepartmentModel = {
  // Create a new department
  async create(departmentData) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([departmentData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Find department by ID
  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get all departments
  async findAll() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update department
  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Delete department
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
  DepartmentModel,
};
