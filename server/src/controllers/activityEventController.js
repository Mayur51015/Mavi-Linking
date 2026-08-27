const { getUnifiedTimeline, reconstructStateAsOf } = require('../services/activityEventService');

const getMyTimeline = async (req, res, next) => {
  try {
    const { platform, eventType, from, to, limit } = req.query;
    const events = await getUnifiedTimeline(req.user.id, {
      platform,
      eventType,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const getMyHistoricalState = async (req, res, next) => {
  try {
    const { date } = req.query;
    const result = await reconstructStateAsOf(req.user.id, date);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyTimeline,
  getMyHistoricalState,
};