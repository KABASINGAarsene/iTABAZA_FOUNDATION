const { DepartmentModel } = require("../models/department.model");
const departmentRouter = require("express").Router();

// Get all departments
departmentRouter.get("/all", async (req, res) => {
  try {
    const departments = await DepartmentModel.findAll();
    res.status(200).send({ total: departments.length, departments });
  } catch (error) {
    console.error("Error getting departments:", error);
    res.status(500).send({ msg: "Error in getting department info.." });
  }
});

// Get department by ID
departmentRouter.get("/:id", async (req, res) => {
  try {
    const department = await DepartmentModel.findById(req.params.id);
    if (!department) {
      return res.status(404).send({ msg: "Department not found" });
    }
    res.status(200).send({ department });
  } catch (error) {
    console.error("Error getting department:", error);
    res.status(500).send({ msg: "Error in getting department info.." });
  }
});

// Add a new department
departmentRouter.post("/add", async (req, res) => {
  let { deptName, about, image } = req.body;
  
  try {
    const departmentData = {
      dept_name: deptName,
      about,
      image
    };

    const department = await DepartmentModel.create(departmentData);
    res.status(201).send({ msg: "Department has been created", department });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).send({ 
      msg: "Error in creating department",
      error: error.message 
    });
  }
});

// Update department
departmentRouter.patch("/update/:id", async (req, res) => {
  let id = req.params.id;
  let updates = req.body;
  
  try {
    const isDepartmentPresent = await DepartmentModel.findById(id);
    if (!isDepartmentPresent) {
      return res.status(404).send({ msg: "Department not found" });
    }
    
    const department = await DepartmentModel.update(id, updates);
    res.status(200).send({ msg: "Department updated successfully", department });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).send({ msg: "Error in updating department" });
  }
});

// Delete department
departmentRouter.delete("/delete/:id", async (req, res) => {
  let id = req.params.id;
  
  try {
    const isDepartmentPresent = await DepartmentModel.findById(id);
    if (!isDepartmentPresent) {
      return res.status(404).send({ msg: "Department not found" });
    }
    
    await DepartmentModel.delete(id);
    res.status(200).send({ msg: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).send({ msg: "Error in deleting department" });
  }
});

// Real-time department updates
departmentRouter.get("/realtime", async (req, res) => {
  try {
    const { supabase } = require("../config/db");
    
    const subscription = supabase
      .channel('departments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'departments' }, 
        (payload) => {
          console.log('Department change:', payload);
        }
      )
      .subscribe();

    res.json({ message: "Real-time department subscription set up" });
  } catch (error) {
    res.status(500).send({ msg: "Error setting up real-time", error: error.message });
  }
});

module.exports = {
  departmentRouter,
};
