const { OpenAI } = require('openai');
const Insight = require('../models/Insight');
const DNA = require('../models/DNA');
const Ranking = require('../models/Ranking');
const Analytics = require('../models/Analytics');

const analyzeUser = async (user) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;
  const grokApiKey = process.env.GROK_API_KEY;
  const openaiApiKey = process.env.OPENAI_INSIGHTS_API_KEY || process.env.OPENAI_API_KEY;

  const apiKey = geminiApiKey || groqApiKey || grokApiKey || openaiApiKey;

  if (!apiKey) {
    throw new Error('API key is missing. Please set GEMINI_API_KEY in server/.env');
  }

  const baseURL = geminiApiKey ? 'https://generativelanguage.googleapis.com/v1beta/openai/'
                : groqApiKey ? 'https://api.groq.com/openai/v1' 
                : grokApiKey ? 'https://api.x.ai/v1' 
                : undefined;

  const openai = new OpenAI({ apiKey, baseURL });
  
  const modelName = geminiApiKey ? 'gemini-2.5-flash'
                  : groqApiKey ? 'llama-3.1-8b-instant' 
                  : grokApiKey ? 'grok-2-latest' 
                  : 'gpt-4o-mini';
  
  // Construct user data profile
  const profileSummary = JSON.stringify({
    scores: user.scores,
    platforms: user.platformData,
    name: user.name
  });

  const prompt = `You are an expert AI recruiter system. Analyze the developer data and provide a detailed JSON profile. 
The developer data: ${profileSummary}

Format exactly as valid JSON:
{
  "insight": {
    "specialization": "Frontend Developer | Backend Developer | Full Stack ...",
    "topSkills": ["React", "Node", "MongoDB"],
    "techStack": ["JavaScript", "React", "Express"],
    "confidenceScores": {"React": 90, "Node": 85},
    "strengths": ["...", "..."],
    "improvements": ["...", "..."],
    "careerRecommendations": ["..."]
  },
  "dna": {
    "personalityType": "Problem Solver",
    "workingStyle": "Collaborative",
    "scores": {"collaboration": 80, "innovation": 90, "learningAdaptability": 85, "consistency": 70},
    "description": "..."
  },
  "analytics": {
    "aiSummary": "..."
  }
}`;

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: 'You are an AI Developer Intelligence System.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Calculate dynamic ranking score based on user.scores + some variance
  const rawScore = (user.scores?.overall || 0);
  let tier = 'Bronze';
  if (rawScore > 800) tier = 'Elite Developer';
  else if (rawScore > 600) tier = 'Gold';
  else if (rawScore > 300) tier = 'Silver';

  // Save to DB
  const insight = await Insight.findOneAndUpdate(
    { userId: user._id },
    { ...result.insight, userId: user._id },
    { new: true, upsert: true }
  );

  const dna = await DNA.findOneAndUpdate(
    { userId: user._id },
    { ...result.dna, userId: user._id },
    { new: true, upsert: true }
  );

  const ranking = await Ranking.findOneAndUpdate(
    { userId: user._id },
    { score: rawScore, tier, userId: user._id },
    { new: true, upsert: true }
  );

  const month = new Date().toISOString().slice(0, 7);
  const analytics = await Analytics.findOneAndUpdate(
    { userId: user._id, month },
    { aiSummary: result.analytics.aiSummary, userId: user._id, month },
    { new: true, upsert: true }
  );

  return { insight, dna, ranking, analytics };
};

module.exports = {
  analyzeUser
};
