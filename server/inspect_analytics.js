require('dotenv').config();
const mongoose = require('mongoose');

async function checkAnalytics() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const User = require('./src/models/User');
    const Analytics = require('./src/models/Analytics');
    const aiAnalyzer = require('./src/services/aiAnalyzer');

    const user = await User.findOne({ email: 'mayur2006khandare@gmail.com' });
    console.log('User ID:', user._id);

    let docs = await Analytics.find({ userId: user._id }).sort({ month: 1 });
    console.log('Analytics Docs Count BEFORE:', docs.length);
    console.log('Docs BEFORE:', JSON.stringify(docs, null, 2));

    // Force regenerate analytics for user to make sure 6-month data exists
    console.log('\nRegenerating AI analytics for student user...');
    const result = await aiAnalyzer.analyzeUser(user);
    
    docs = await Analytics.find({ userId: user._id }).sort({ month: 1 });
    console.log('\nAnalytics Docs Count AFTER:', docs.length);
    console.log('Docs AFTER:', JSON.stringify(docs, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAnalytics();
