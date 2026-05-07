require('dotenv').config();
const { analyzeUser } = require('./src/services/aiAnalyzer');
const mongoose = require('mongoose');

// Mock user
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Test Developer',
  scores: {
    development: 850,
    problemSolving: 900,
    knowledge: 800,
    overall: 850
  },
  platformData: {
    github: { publicRepos: 10, followers: 5 },
    leetcode: { solved: 100, solvedEasy: 50, solvedMedium: 30, solvedHard: 20 }
  }
};

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    console.log('Testing Gemini API integration...');
    const result = await analyzeUser(mockUser);
    console.log('SUCCESS! AI Data generated:');
    console.log(JSON.stringify(result.insight, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('FAILED:', err);
    process.exit(1);
  }
}

test();
