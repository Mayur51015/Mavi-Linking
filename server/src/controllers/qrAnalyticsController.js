const crypto = require('crypto');
const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const User = require('../models/User');
const QRScan = require('../models/QRScan');

const hashIp = (ip) => {
  return crypto.createHash('sha256').update(ip || '0.0.0.0').digest('hex');
};

const recordScan = async (req, res, next) => {
  try {
    const { username } = req.params;
    const { ref, visitorType, sessionId } = req.body;

    // Find the target user
    const user = await User.findOne({ username }).select('_id qrAnalytics');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Parse IP and User-Agent
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const hashedIp = hashIp(ip);
    const userAgentStr = req.headers['user-agent'];
    const parser = new UAParser(userAgentStr);
    const parsedUA = parser.getResult();

    const deviceType = parsedUA.device.type === 'mobile' ? 'Mobile' : (parsedUA.device.type === 'tablet' ? 'Tablet' : 'Desktop');
    const osName = parsedUA.os.name || 'Unknown';
    const browserName = parsedUA.browser.name || 'Unknown';

    // Parse Location
    const geo = geoip.lookup(ip);
    const location = {
      country: geo?.country || 'Unknown',
      region: geo?.region || 'Unknown',
      city: geo?.city || 'Unknown',
    };

    // Determine referral source
    let referralSource = 'Unknown';
    if (['resume', 'linkedin', 'shared link', 'qr download'].includes(ref?.toLowerCase())) {
      referralSource = ref.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (ref === 'qr') {
      referralSource = 'QR Download';
    }

    // Determine unique visitor (no scan from this session or IP within the last 24h)
    const recentScan = await QRScan.findOne({
      studentId: user._id,
      $or: [{ sessionId }, { ipAddress: hashedIp }],
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const isUnique = !recentScan;

    // Prevent spam: ignore exact same session scans within 1 minute
    if (recentScan && (Date.now() - new Date(recentScan.timestamp).getTime() < 60000)) {
      return res.status(200).json({ success: true, message: 'Scan ignored (spam prevention)' });
    }

    // Save scan
    const newScan = await QRScan.create({
      studentId: user._id,
      profileId: username,
      deviceType,
      os: osName,
      browser: browserName,
      ipAddress: hashedIp,
      location,
      referralSource,
      visitorType: visitorType || 'Guest',
      sessionId: sessionId || crypto.randomUUID(),
      isUnique,
    });

    // Backwards compatibility: update User.qrAnalytics
    user.qrAnalytics = user.qrAnalytics || { scanCount: 0, devices: [] };
    user.qrAnalytics.scanCount += 1;
    user.qrAnalytics.lastScan = new Date();
    if (!user.qrAnalytics.devices.includes(deviceType)) {
      user.qrAnalytics.devices.push(deviceType);
    }
    await user.save();

    // Fire Socket.IO event to the student's dashboard
    const io = req.app.get('io');
    if (io) {
      // Assuming users join a room with their ObjectId
      io.to(user._id.toString()).emit('qr_scan_event', newScan);
    }

    res.status(201).json({ success: true, message: 'Scan recorded successfully' });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Aggregations
    const totalScans = await QRScan.countDocuments({ studentId });
    const uniqueVisitors = await QRScan.countDocuments({ studentId, isUnique: true });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayScans = await QRScan.countDocuments({ studentId, timestamp: { $gte: todayStart } });
    const weeklyScans = await QRScan.countDocuments({ studentId, timestamp: { $gte: weekStart } });
    const monthlyScans = await QRScan.countDocuments({ studentId, timestamp: { $gte: monthStart } });

    const lastScanDoc = await QRScan.findOne({ studentId }).sort({ timestamp: -1 }).select('timestamp');

    // Devices, Browsers, Referrals, Location aggregations
    const deviceDist = await QRScan.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: '$deviceType', count: { $sum: 1 } } }
    ]);

    const browserDist = await QRScan.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const referralDist = await QRScan.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: '$referralSource', count: { $sum: 1 } } }
    ]);

    const visitorTypeDist = await QRScan.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: { _id: '$visitorType', count: { $sum: 1 } } }
    ]);

    // Timeline over last 7 days
    const dailyGraph = await QRScan.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId), timestamp: { $gte: weekStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          scans: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format daily graph
    let timeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyGraph.find(g => g._id === dateStr);
      timeline.push({
        date: dateStr,
        scans: match ? match.scans : 0
      });
    }

    const recentScans = await QRScan.find({ studentId }).sort({ timestamp: -1 }).limit(20);

    res.status(200).json({
      success: true,
      data: {
        totalScans,
        uniqueVisitors,
        todayScans,
        weeklyScans,
        monthlyScans,
        lastScanTime: lastScanDoc ? lastScanDoc.timestamp : null,
        deviceDist: deviceDist.map(d => ({ name: d._id, value: d.count })),
        browserDist: browserDist.map(b => ({ name: b._id, value: b.count })),
        referralDist: referralDist.map(r => ({ name: r._id, value: r.count })),
        visitorTypeDist: visitorTypeDist.map(v => ({ name: v._id, value: v.count })),
        timeline,
        recentScans,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordScan,
  getAnalytics,
};
