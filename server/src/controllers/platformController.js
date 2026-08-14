const User = require('../models/User');
const { fetchPlatformProfile } = require('../services/platformService');
const { calculateAggregatedScores } = require('../services/scoreService');

// Allowed platforms — used for validation throughout the system
const VALID_PLATFORMS = ['github', 'codeforces', 'leetcode', 'stackoverflow'];

/**
 * @desc    Get all linked platforms for the authenticated user
 * @route   GET /api/platforms
 * @access  Private
 */
const getLinkedPlatforms = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Build a summary of linked vs unlinked platforms
    const platformStatus = {};
    for (const platform of VALID_PLATFORMS) {
      const data = user.platforms[platform];
      platformStatus[platform] = {
        linked: !!data.username,
        username: data.username || null,
        linkedAt: data.linkedAt || null,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        platforms: platformStatus,
        linkedCount: Object.values(platformStatus).filter((p) => p.linked).length,
        totalPlatforms: VALID_PLATFORMS.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Link a platform account (add or update username)
 * @route   PUT /api/platforms/:platform
 * @access  Private
 */
const linkPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { username } = req.body;

    // Validate platform name
    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`,
      });
    }

    // Validate username
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    // Sanitize username based on platform rules
    const sanitized = sanitizeUsername(platform, username.trim());
    if (!sanitized.valid) {
      return res.status(400).json({
        success: false,
        message: sanitized.message,
      });
    }

    // Fetch external platform profile and cache it
    let platformData;
    try {
      platformData = await fetchPlatformProfile(platform, sanitized.username);
    } catch (fetchError) {
      return res.status(404).json({
        success: false,
        message: fetchError.message || `Unable to fetch ${capitalize(platform)} profile for "${sanitized.username}". Please check the username and try again.`,
      });
    }

    // Update the specific platform fields
    const updateQuery = {
      [`platforms.${platform}.username`]: sanitized.username,
      [`platforms.${platform}.linkedAt`]: new Date(),
      [`platformData.${platform}`]: platformData,
      lastSyncedAt: new Date(),
    };

    let user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateQuery },
      { new: true, runValidators: true }
    );

    // Auto-recalculate scores after linking
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const { logTimelineEvent } = require('../utils/timelineLogger');
    
    await logTimelineEvent(
      user._id,
      'PLATFORM',
      `Linked account: ${capitalize(platform)}`,
      `Linked username: ${sanitized.username}`,
      { platform }
    );

    // Sync GitHub activity after successfully linking a GitHub account.
    // Activity sync failure should not prevent the account from being linked.
    if (platform === 'github') {
      try {
        const { syncGitHubActivities } = require('../services/githubActivityService');
        await syncGitHubActivities(user._id);
      } catch (syncError) {
        console.error('GitHub activity sync failed:', syncError.message);
      }
    }

    const updatedUser = await evaluateUserIntelligence(user._id);

    res.status(200).json({
      success: true,
      message: `${capitalize(platform)} account linked successfully`,
      data: {
        platform,
        username: sanitized.username,
        linkedAt: (updatedUser || user).platforms[platform].linkedAt,
        platformData,
        user: updatedUser || user
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unlink a platform account (remove username)
 * @route   DELETE /api/platforms/:platform
 * @access  Private
 */
const unlinkPlatform = async (req, res, next) => {
  try {
    const { platform } = req.params;

    // Validate platform name
    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`,
      });
    }

    // Check if platform is actually linked
    const user = await User.findById(req.user.id);
    if (!user.platforms[platform].username) {
      return res.status(400).json({
        success: false,
        message: `${capitalize(platform)} account is not linked`,
      });
    }

    // Clear platform data
    const updateQuery = {
      [`platforms.${platform}.username`]: '',
      [`platforms.${platform}.linkedAt`]: null,
      [`platformData.${platform}`]: null,
    };

    let userToUpdate = await User.findByIdAndUpdate(req.user.id, { $set: updateQuery }, { new: true });
    
    // Auto-recalculate scores after unlinking
    const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
    const { logTimelineEvent } = require('../utils/timelineLogger');

    await logTimelineEvent(
      req.user.id,
      'PLATFORM',
      `Unlinked account: ${capitalize(platform)}`,
      `Removed platform integration`,
      { platform }
    );

    const updatedUser = await evaluateUserIntelligence(req.user.id);

    res.status(200).json({
      success: true,
      message: `${capitalize(platform)} account unlinked successfully`,
      data: { platform, user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Link multiple platforms at once (bulk operation)
 * @route   PUT /api/platforms
 * @access  Private
 */
const linkMultiplePlatforms = async (req, res, next) => {
  try {
    const { platforms } = req.body;

    if (!platforms || typeof platforms !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain a "platforms" object with platform:username pairs',
      });
    }

    const results = { linked: [], errors: [] };
    const updateQuery = {};

    for (const [platform, username] of Object.entries(platforms)) {
      // Validate platform
      if (!VALID_PLATFORMS.includes(platform)) {
        results.errors.push({
          platform,
          message: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`,
        });
        continue;
      }

      // Validate username
      if (!username || !username.toString().trim()) {
        results.errors.push({ platform, message: 'Username is required' });
        continue;
      }

      // Sanitize
      const sanitized = sanitizeUsername(platform, username.toString().trim());
      if (!sanitized.valid) {
        results.errors.push({ platform, message: sanitized.message });
        continue;
      }

      // Fetch external profile data for the platform
      try {
        const platformData = await fetchPlatformProfile(platform, sanitized.username);
        updateQuery[`platforms.${platform}.username`] = sanitized.username;
        updateQuery[`platforms.${platform}.linkedAt`] = new Date();
        updateQuery[`platformData.${platform}`] = platformData;
        results.linked.push({ platform, username: sanitized.username, platformData });
      } catch (fetchError) {
        results.errors.push({
          platform,
          message: fetchError.message || `Unable to fetch ${platform} profile`,
        });
      }
    }

    // Apply all valid updates in a single DB operation
    if (Object.keys(updateQuery).length > 0) {
      updateQuery.lastSyncedAt = new Date();
      let userObj = await User.findByIdAndUpdate(req.user.id, { $set: updateQuery }, { new: true });
      
      const { evaluateUserIntelligence } = require('../services/careerIntelligenceService');
      const { logTimelineEvent } = require('../utils/timelineLogger');

      for (const item of results.linked) {
        await logTimelineEvent(
          req.user.id,
          'PLATFORM',
          `Linked account: ${capitalize(item.platform)}`,
          `Linked username: ${item.username}`,
          { platform: item.platform }
        );
      }

      const updatedUser = await evaluateUserIntelligence(req.user.id);
      results.user = updatedUser;
    }

    const statusCode = results.errors.length > 0
      ? (results.linked.length > 0 ? 207 : 400)  // 207 = Multi-Status
      : 200;

    res.status(statusCode).json({
      success: results.linked.length > 0,
      message: `${results.linked.length} platform(s) linked${results.errors.length > 0 ? `, ${results.errors.length} failed` : ''}`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profile data for all linked platforms
 * @route   GET /api/platforms/data
 * @access  Private
 */
const getAllPlatformData = async (req, res, next) => {
  try {
    const refresh = req.query.refresh === 'true';
    const user = await User.findById(req.user.id);
    const platformResults = {};
    const fetchErrors = [];
    let shouldSave = false;

    for (const platform of VALID_PLATFORMS) {
      const username = user.platforms[platform].username;
      const linkedAt = user.platforms[platform].linkedAt;
      let platformData = user.platformData[platform];

      if (username && (refresh || !platformData)) {
        try {
          platformData = await fetchPlatformProfile(platform, username);
          user.platformData[platform] = platformData;
          shouldSave = true;
        } catch (fetchError) {
          fetchErrors.push({ platform, message: fetchError.message });
          platformData = user.platformData[platform] || null;
        }
      }

      platformResults[platform] = {
        linked: !!username,
        username: username || null,
        linkedAt: linkedAt || null,
        platformData: platformData || null,
      };
    }

    if (shouldSave) {
      user.lastSyncedAt = new Date();
      user.scores = calculateAggregatedScores(user.platformData);
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        platforms: platformResults,
        linkedCount: Object.values(platformResults).filter((p) => p.linked).length,
        totalPlatforms: VALID_PLATFORMS.length,
        errors: fetchErrors,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profile data for a single linked platform
 * @route   GET /api/platforms/:platform/data
 * @access  Private
 */
const getPlatformData = async (req, res, next) => {
  try {
    const { platform } = req.params;
    const refresh = req.query.refresh === 'true';

    if (!VALID_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`,
      });
    }

    const user = await User.findById(req.user.id);
    const username = user.platforms[platform].username;
    const linkedAt = user.platforms[platform].linkedAt;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: `${capitalize(platform)} is not linked yet`,
      });
    }

    let platformData = user.platformData[platform];
    if (refresh || !platformData) {
      try {
        platformData = await fetchPlatformProfile(platform, username);
        user.platformData[platform] = platformData;
        user.lastSyncedAt = new Date();
        user.scores = calculateAggregatedScores(user.platformData);
        await user.save();
      } catch (fetchError) {
        return res.status(404).json({
          success: false,
          message: fetchError.message || `Unable to fetch ${platform} profile`,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        platform,
        username,
        linkedAt,
        platformData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Validate and sanitize username based on platform-specific rules.
 */
function sanitizeUsername(platform, username) {
  const rules = {
    github: {
      pattern: /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/,
      maxLength: 39,
      message: 'GitHub username must be alphanumeric (hyphens allowed, not at start/end), max 39 chars',
    },
    codeforces: {
      pattern: /^[a-zA-Z0-9._-]{3,24}$/,
      maxLength: 24,
      message: 'Codeforces handle must be 3-24 chars (letters, digits, dots, underscores, hyphens)',
    },
    leetcode: {
      pattern: /^[a-zA-Z0-9_-]{1,30}$/,
      maxLength: 30,
      message: 'LeetCode username must be 1-30 chars (letters, digits, underscores, hyphens)',
    },
    stackoverflow: {
      // Stack Overflow uses numeric user IDs in their API
      pattern: /^\d{1,15}$/,
      maxLength: 15,
      message: 'Stack Overflow requires your numeric user ID (found in your profile URL)',
    },
  };

  const rule = rules[platform];
  if (!rule) {
    return { valid: false, message: 'Unknown platform' };
  }

  if (username.length > rule.maxLength) {
    return { valid: false, message: rule.message };
  }

  if (!rule.pattern.test(username)) {
    return { valid: false, message: rule.message };
  }

  return { valid: true, username };
}

/**
 * Capitalize first letter of a string.
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  getLinkedPlatforms,
  getAllPlatformData,
  getPlatformData,
  linkPlatform,
  unlinkPlatform,
  linkMultiplePlatforms,
  VALID_PLATFORMS,
};
