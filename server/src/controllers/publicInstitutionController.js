const Institution = require('../models/Institution');
const Department = require('../models/Department');
const User = require('../models/User');

/**
 * @desc    Validate institution code & return safe public institution details
 * @route   GET /api/public/institutions/by-code/:institutionCode
 * @access  Public
 */
exports.validateInstitutionCode = async (req, res, next) => {
  try {
    const { institutionCode } = req.params;

    if (!institutionCode || !institutionCode.trim()) {
      return res.status(400).json({
        success: false,
        code: 'INSTITUTION_CODE_INVALID',
        message: 'Institution Code is required.',
      });
    }

    const cleanCode = institutionCode.trim();
    const upperCode = cleanCode.toUpperCase();

    // Search by institutionCode, tenantId, shortName, or code
    const institution = await Institution.findOne({
      $or: [
        { institutionCode: upperCode },
        { tenantId: upperCode },
        { shortName: upperCode },
        { code: upperCode },
      ],
    });

    if (!institution) {
      return res.status(404).json({
        success: false,
        code: 'INSTITUTION_CODE_INVALID',
        message: 'Invalid Institution Code. Please check the code provided by your institution.',
      });
    }

    if (institution.status !== 'active' || (institution.licenseStatus && institution.licenseStatus !== 'active')) {
      return res.status(400).json({
        success: false,
        code: 'INSTITUTION_INACTIVE',
        message: 'Student registration for this institution is currently unavailable.',
      });
    }

    res.status(200).json({
      success: true,
      institution: {
        id: institution._id,
        name: institution.name,
        code: institution.institutionCode || institution.tenantId,
        shortName: institution.shortName || '',
        logo: institution.logo || '',
        city: institution.city || '',
        state: institution.state || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch active departments for a validated institution
 * @route   GET /api/public/institutions/:institutionId/departments
 * @access  Public
 */
exports.getPublicDepartmentsByInstitution = async (req, res, next) => {
  try {
    const { institutionId } = req.params;

    const institution = await Institution.findById(institutionId);
    if (!institution || institution.status !== 'active') {
      return res.status(400).json({
        success: false,
        code: 'INSTITUTION_INACTIVE',
        message: 'Institution is inactive or unavailable.',
      });
    }

    const departments = await Department.find({
      institutionId: institution._id,
      status: 'active',
    }).select('_id name code description').sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: departments.length,
      departments: departments.map((d) => ({
        id: d._id,
        departmentId: d._id,
        name: d.name,
        code: d.code || '',
        description: d.description || '',
      })),
    });
  } catch (error) {
    next(error);
  }
};
