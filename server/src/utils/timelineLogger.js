const TimelineEvent = require('../models/TimelineEvent');
const CareerTimeline = require('../models/CareerTimeline');
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

    await CareerTimeline.create({
      user: userId,
      type,
      title,
      description,
    });

    // Broadcast to user's room
    try {
      const io = getIO();
      io.to(userId.toString()).emit('new_timeline_event', event);
      io.emit('global_activity_feed', { ...event.toObject(), user: userId });
      
      // Real-time update trigger
      io.to(userId.toString()).emit('career_update', { userId });
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
