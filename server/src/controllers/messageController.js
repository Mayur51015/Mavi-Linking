const Message = require('../models/Message');
const User = require('../models/User');
const RecruitmentNotification = require('../models/RecruitmentNotification');
const {
  CONVERSATIONS_DEFAULT_LIMIT,
  CONVERSATIONS_MAX_LIMIT,
  parsePagination,
  parseHistoryQuery,
  isValidObjectId,
  buildConversationsPipeline,
  buildHistoryFilter,
  buildHistoryPage,
} = require('./messagePagination');

const { MESSAGE_MAX_LENGTH } = Message;

/**
 * Checks whether a sender is allowed to message a recipient based on role and scope.
 * @param {Object} sender - The user sending the message (req.user).
 * @param {Object} recipient - The target user document.
 * @returns {boolean} true if messaging is permitted.
 */
function isMessageAllowed(sender, recipient) {
  const getNormalizedRole = (role) => {
    if (role === 'professor') return 'teacher';
    if (role === 'developer') return 'user';
    return role;
  };

  const senderRole = getNormalizedRole(sender.role);
  const recipientRole = getNormalizedRole(recipient.role);

  // Helper for fuzzy string matching (removes non-alphanumeric, case-insensitive, substring and acronym check)
  const cleanString = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  const matchFuzzy = (str1, str2) => {
    const s1 = cleanString(str1);
    const s2 = cleanString(str2);
    if (!s1 || !s2) return false;
    
    // Direct or substring match
    if (s1.includes(s2) || s2.includes(s1)) return true;
    
    // Acronym / abbreviation match
    const getAcronyms = (str) => {
      const words = str.toLowerCase().split(/[^a-z0-9]/).filter(Boolean);
      const stopWords = ['of', 'and', 'in', 'at', 'for', 'the', 'to'];
      // Keep first letters
      const initials = words.filter(w => w.length > 0).map(w => w[0]).join('');
      // Without stop words
      const initialsClean = words.filter(w => !stopWords.includes(w)).map(w => w[0]).join('');
      // With 'of' (for ZCOER)
      const initialsWithOf = words.filter(w => !stopWords.includes(w) || w === 'of').map(w => w[0]).join('');
      return [initials, initialsClean, initialsWithOf];
    };

    const acronyms1 = getAcronyms(str1);
    const acronyms2 = getAcronyms(str2);
    
    // Check if s1 matches any acronym of s2
    if (acronyms2.some(ac => {
      if (!ac) return false;
      if (ac.length >= 3 && s1.length >= 3) {
        return ac === s1 || ac.includes(s1) || s1.includes(ac);
      }
      return ac === s1;
    })) return true;
    
    // Check if s2 matches any acronym of s1
    if (acronyms1.some(ac => {
      if (!ac) return false;
      if (ac.length >= 3 && s2.length >= 3) {
        return ac === s2 || ac.includes(s2) || s2.includes(ac);
      }
      return ac === s2;
    })) return true;
    
    return false;
  };

  // Helper to match comma-separated departments or colleges
  const matchLists = (listStr1, listStr2) => {
    if (!listStr1 || !listStr2) return false;
    const array1 = listStr1.split(',').map(cleanString).filter(Boolean);
    const array2 = listStr2.split(',').map(cleanString).filter(Boolean);
    return array1.some(item1 => array2.some(item2 => item1.includes(item2) || item2.includes(item1)));
  };

  // Student can always message teachers/recruiters
  if (senderRole === 'user' && (recipientRole === 'teacher' || recipientRole === 'recruiter')) {
    return { allowed: true };
  }

  // Teacher ↔ Recruiter: unrestricted
  if ((senderRole === 'teacher' && recipientRole === 'recruiter') ||
      (senderRole === 'recruiter' && recipientRole === 'teacher')) {
    return { allowed: true };
  }

  // Teacher → Student: must share same college and department
  if (senderRole === 'teacher' && recipientRole === 'user') {
    const sUni = sender.university || {};
    const rUni = recipient.university || {};
    
    const collegeMatch = matchFuzzy(sUni.name, rUni.name);
    if (!collegeMatch) {
      return { 
        allowed: false, 
        reason: `Mismatched college. Teacher is from "${sUni.name || 'Not set'}" but Student is from "${rUni.name || 'Not set'}".` 
      };
    }
    
    const deptMatch = matchLists(sUni.department, rUni.department);
    if (!deptMatch) {
      return { 
        allowed: false, 
        reason: `Mismatched department. Teacher teaches in "${sUni.department || 'Not set'}" but Student is studying in "${rUni.department || 'Not set'}".` 
      };
    }
    
    return { allowed: true };
  }

  // Recruiter → Student: must be within allowed colleges/departments (if defined)
  if (senderRole === 'recruiter' && recipientRole === 'user') {
    const allowedColleges = sender.allowedColleges || [];
    const allowedDepts = sender.allowedDepartments || [];
    const rUni = recipient.university || {};
    
    // If no restrictions, allow all
    if (allowedColleges.length === 0 && allowedDepts.length === 0) {
      return { allowed: true };
    }
    
    const collegeMatch = allowedColleges.length === 0 || allowedColleges.some(c => matchFuzzy(c, rUni.name));
    if (!collegeMatch) {
      return { 
        allowed: false, 
        reason: `Mismatched college. Recruiter's permitted colleges [${allowedColleges.join(', ')}] do not include student's college "${rUni.name || 'Not set'}".` 
      };
    }
    
    const deptMatch = allowedDepts.length === 0 || allowedDepts.some(d => matchLists(d, rUni.department));
    if (!deptMatch) {
      return { 
        allowed: false, 
        reason: `Mismatched department. Recruiter's permitted departments [${allowedDepts.join(', ')}] do not include student's department "${rUni.department || 'Not set'}".` 
      };
    }
    
    return { allowed: true };
  }

  // Default allow (fallback to existing behavior)
  return { allowed: true };
}


/**
 * @desc    Get conversations for the logged-in user, newest activity first
 * @route   GET /api/messages?page=&limit=
 * @access  Private
 *
 * The fold to one row per conversation happens in the database now. It used to
 * be a `Message.find()` with no limit and no `lean()`, followed by a JavaScript
 * loop that kept the first message per partner and threw the rest away — so the
 * cost of loading the inbox grew with every message anyone had ever sent, and
 * was paid again on every load.
 */
const getConversations = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: CONVERSATIONS_DEFAULT_LIMIT,
      maxLimit: CONVERSATIONS_MAX_LIMIT,
    });

    const rows = await Message.aggregate(buildConversationsPipeline(req.user.id, { skip, limit }));

    // One extra row was requested to detect a further page without a count.
    const hasMore = rows.length > limit;
    const conversations = hasMore ? rows.slice(0, limit) : rows;

    res.status(200).json({
      success: true,
      // Still a bare array, as before — the pagination block is a sibling key,
      // matching how documentController.getDocuments reports it.
      data: conversations,
      pagination: { page, limit, hasMore },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get chat history between current user and specified user
 * @route   GET /api/messages/:userId?limit=&before=
 * @access  Private
 *
 * Returns the most recent page by default, oldest-first so the render order is
 * unchanged, with a `before` cursor to walk backwards. Previously this returned
 * the entire thread on every open.
 */
const getChatHistory = async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;

    // Validated here rather than left to produce a CastError. The client has an
    // isValidObjectId guard, but that is the wrong side of the trust boundary.
    if (!isValidObjectId(otherUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }

    const { limit, before } = parseHistoryQuery(req.query);

    const rows = await Message.find(buildHistoryFilter(req.user.id, otherUserId, before))
      // Descending to take the newest page; buildHistoryPage flips it back.
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const { messages, hasMore, nextBefore } = buildHistoryPage(rows, limit);

    // Mark incoming messages as read. Only meaningful on the first page — a
    // client paging back through history is not reading anything new.
    if (!before) {
      await Message.updateMany(
        { senderId: otherUserId, recipientId: req.user.id, status: { $ne: 'read' } },
        { $set: { status: 'read' } }
      );
    }

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: { limit, hasMore, nextBefore },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Send a message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ success: false, message: 'Recipient ID and content are required' });
    }

    if (!isValidObjectId(recipientId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipient ID.' });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    // Matches the schema's maxlength, so an over-long message is a clear 400
    // rather than a ValidationError shaped by the global handler.
    if (content.length > MESSAGE_MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Message content cannot exceed ${MESSAGE_MAX_LENGTH} characters.`,
      });
    }

    // Load recipient user to enforce scope rules
    const recipient = await User.findById(recipientId).select('name role university allowedColleges allowedDepartments');

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const authResult = isMessageAllowed(req.user, recipient);

    if (!authResult.allowed) {
      return res.status(403).json({
        success: false,
        message: authResult.reason,
        code: 'FORBIDDEN',
      });
    }

    const msg = await Message.create({
      senderId: req.user.id,
      recipientId,
      content,
      status: 'sent',
    });

    // Create a notification for the recipient about the new message
    await RecruitmentNotification.create({
      recipientId,
      senderId: req.user.id,
      type: 'message',
      title: 'New message received',
      message: content,
      metadata: { messageId: msg._id },
    });

    // Real-time notification via Socket.io
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      if (io) {
        io.to(recipientId.toString()).emit('new_message', msg);
      }
    } catch (err) {
      // Socket not initialized in testing
    }

    res.status(201).json({
      success: true,
      data: msg,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getChatHistory,
  sendMessage,
  isMessageAllowed,
};
