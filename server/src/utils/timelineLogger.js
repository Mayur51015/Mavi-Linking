const TimelineEvent = require('../models/TimelineEvent');
const { getIO } = require('../config/socket');

const logTimelineEvent = async (userId, type, title, description = '', metadata = {}) => {
  try {
    const event = await TimelineEvent.create({
      user: userId,
      type,
      title,
      description,
      metadata,
    });

    // Broadcast to user's room
    try {
      const io = getIO();
      io.to(userId.toString()).emit('new_timeline_event', event);
      // We can also emit to a 'recruiters' room if we implement room joining for recruiters
      io.emit('global_activity_feed', { ...event.toObject(), user: userId });
    } catch (ioError) {
      console.warn('Socket.IO emit failed in logTimelineEvent:', ioError.message);
    }

    return event;
  } catch (error) {
    console.error('Error logging timeline event:', error);
  }
};

module.exports = {
  logTimelineEvent,
};
