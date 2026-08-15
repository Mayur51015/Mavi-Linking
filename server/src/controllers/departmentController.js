const Department = require('../models/Department');
const User = require('../models/User');

/**
 * @desc    Create a new department in an institution
 * @route   POST /api/admin/departments
 * @access  Private (Owner, Super Admin, Institution Admin)
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }

    let institutionId = req.body.institutionId;
    if (req.institutionScope?.institutionId) {
      institutionId = req.institutionScope.institutionId;
    }

    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution ID is required.' });
    }

    // Evaluate SaaS plan resource limits for departments
    const { checkPlanLimit } = require('../services/entitlementService');
    const limitCheck = await checkPlanLimit(institutionId, 'department');
    if (!limitCheck.allowed) {
      return res.status(400).json({
        success: false,
        code: 'PLAN_LIMIT_EXCEEDED',
        message: limitCheck.message,
      });
    }

    // Check duplicate department name in institution
    const existing = await Department.findOne({
      institutionId,
      name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: `Department '${name.trim()}' already exists in this institution.` });
    }

    const department = await Department.create({
      institutionId,
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : name.substring(0, 4).toUpperCase(),
      description: description ? description.trim() : '',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Department '${department.name}' created successfully.`,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get departments and student/teacher/admin breakdown for current institution
 * @route   GET /api/admin/departments
 * @access  Private (Owner, Super Admin, Institution Admin, Department Admin)
 */
const getDepartments = async (req, res, next) => {
  try {
    const scopeQuery = req.institutionScope?.institutionId
      ? { institutionId: req.institutionScope.institutionId }
      : {};

    // 1. Fetch DB departments
    const dbDepts = await Department.find(scopeQuery).sort({ name: 1 });

    // 2. Fetch users in scope
    const users = await User.find(scopeQuery).select('name email role departmentId university');

    const deptMap = {};

    // Initialize with DB departments
    dbDepts.forEach((d) => {
      deptMap[d._id.toString()] = {
        _id: d._id,
        id: d._id,
        name: d.name,
        code: d.code,
        description: d.description,
        status: d.status,
        students: 0,
        teachers: 0,
        admins: 0,
        total: 0,
        adminUsers: [],
      };
    });

    // Populate user counts
    users.forEach((u) => {
      let dKey = u.departmentId ? u.departmentId.toString() : null;

      // Fallback matching by university department string if departmentId not linked
      if (!dKey && u.university?.department) {
        const matched = dbDepts.find(d => d.name.toLowerCase() === u.university.department.toLowerCase());
        if (matched) dKey = matched._id.toString();
      }

      if (!dKey) {
        dKey = 'unassigned';
        if (!deptMap[dKey]) {
          deptMap[dKey] = { _id: 'unassigned', id: 'unassigned', name: 'General / Unassigned', code: 'GEN', students: 0, teachers: 0, admins: 0, total: 0, adminUsers: [] };
        }
      }

      if (deptMap[dKey]) {
        if (u.role === 'user') deptMap[dKey].students += 1;
        if (u.role === 'teacher') deptMap[dKey].teachers += 1;
        if (u.role === 'department_admin') {
          deptMap[dKey].admins += 1;
          deptMap[dKey].adminUsers.push({ id: u._id, name: u.name, email: u.email });
        }
        deptMap[dKey].total += 1;
      }
    });

    const departmentsList = Object.values(deptMap);

    res.status(200).json({
      success: true,
      data: departmentsList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a department
 * @route   PUT /api/admin/departments/:id
 * @access  Private (Owner, Super Admin, Institution Admin)
 */
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description, status } = req.body;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (req.institutionScope?.institutionId) {
      if (department.institutionId.toString() !== req.institutionScope.institutionId.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access denied for another institution.' });
      }
    }

    if (name) department.name = name.trim();
    if (code) department.code = code.trim().toUpperCase();
    if (description !== undefined) department.description = description.trim();
    if (status && ['active', 'inactive', 'archived'].includes(status)) department.status = status;

    await department.save();

    res.status(200).json({
      success: true,
      message: `Department '${department.name}' updated.`,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Archive a department
 * @route   DELETE /api/admin/departments/:id
 * @access  Private (Owner, Super Admin, Institution Admin)
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (req.institutionScope?.institutionId) {
      if (department.institutionId.toString() !== req.institutionScope.institutionId.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden. Access denied for another institution.' });
      }
    }

    await Department.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Department '${department.name}' deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
};
