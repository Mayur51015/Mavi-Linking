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

    // Initialize with actual DB departments only
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

    let unassignedStudents = 0;
    let unassignedTeachers = 0;

    // Populate user counts
    users.forEach((u) => {
      let dKey = u.departmentId ? u.departmentId.toString() : null;

      // Fallback matching by university department string if departmentId not linked
      if (!dKey && u.university?.department) {
        const matched = dbDepts.find(d => d.name.toLowerCase() === u.university.department.toLowerCase());
        if (matched) dKey = matched._id.toString();
      }

      if (dKey && deptMap[dKey]) {
        if (u.role === 'user' || u.role === 'student') deptMap[dKey].students += 1;
        if (u.role === 'teacher' || u.role === 'professor') deptMap[dKey].teachers += 1;
        if (u.role === 'department_admin') {
          deptMap[dKey].admins += 1;
          deptMap[dKey].adminUsers.push({ id: u._id, name: u.name, email: u.email });
        }
        deptMap[dKey].total += 1;
      } else {
        if (u.role === 'user' || u.role === 'student') unassignedStudents += 1;
        if (u.role === 'teacher' || u.role === 'professor') unassignedTeachers += 1;
      }
    });

    const departmentsList = Object.values(deptMap);

    res.status(200).json({
      success: true,
      data: departmentsList,
      unassigned: {
        students: unassignedStudents,
        teachers: unassignedTeachers,
      },
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
 * @desc    Delete a department (Platform Super Admin / Owner only; forbidden for Institution Admin)
 * @route   DELETE /api/admin/departments/:id
 * @access  Private (Platform Owner, Super Admin only)
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const userRoles = req.user?.roles && req.user.roles.length > 0 ? req.user.roles : [req.user?.role];
    const isSuperAdmin =
      userRoles.includes('super_admin') ||
      userRoles.includes('platform_owner') ||
      userRoles.includes('owner') ||
      req.user?.role === 'super_admin' ||
      req.user?.role === 'platform_owner' ||
      req.user?.role === 'owner' ||
      req.isSuperAdmin;

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        code: 'DEPARTMENT_DELETE_FORBIDDEN',
        message: 'Forbidden. Institution admins are not permitted to delete departments. Department deletion is restricted to platform super administrators.',
      });
    }

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
