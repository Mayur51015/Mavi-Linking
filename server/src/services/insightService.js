const { OpenAI } = require('openai');

const generateInsights = async (user) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is missing. Cannot generate AI insights.');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Construct a summary of the developer's profile based on available data
  const { scores, platformData } = user;
  
  let developerProfile = `Developer Name: ${user.name}\n\n`;
  
  developerProfile += `--- Scores ---\n`;
  developerProfile += `Development: ${scores.development}/1000\n`;
  developerProfile += `Problem Solving: ${scores.problemSolving}/1000\n`;
  developerProfile += `Knowledge: ${scores.knowledge}/1000\n`;
  developerProfile += `Overall: ${scores.overall}/1000\n\n`;

  if (platformData.github) {
    developerProfile += `--- GitHub ---\n`;
    developerProfile += `Public Repos: ${platformData.github.publicRepos}\n`;
    developerProfile += `Followers: ${platformData.github.followers}\n`;
    if (platformData.github.bio) developerProfile += `Bio: ${platformData.github.bio}\n`;
    developerProfile += `\n`;
  }

  if (platformData.leetcode) {
    developerProfile += `--- LeetCode ---\n`;
    developerProfile += `Solved (Total): ${platformData.leetcode.solved}\n`;
    developerProfile += `Solved (Easy): ${platformData.leetcode.solvedEasy}\n`;
    developerProfile += `Solved (Medium): ${platformData.leetcode.solvedMedium}\n`;
    developerProfile += `Solved (Hard): ${platformData.leetcode.solvedHard}\n`;
    developerProfile += `\n`;
  }

  if (platformData.codeforces) {
    developerProfile += `--- Codeforces ---\n`;
    developerProfile += `Rating: ${platformData.codeforces.rating} (Max: ${platformData.codeforces.maxRating})\n`;
    developerProfile += `Rank: ${platformData.codeforces.rank}\n`;
    developerProfile += `\n`;
  }

  if (platformData.stackoverflow) {
    developerProfile += `--- Stack Overflow ---\n`;
    developerProfile += `Reputation: ${platformData.stackoverflow.reputation}\n`;
    developerProfile += `Gold Badges: ${platformData.stackoverflow.goldBadges}\n`;
    developerProfile += `Silver Badges: ${platformData.stackoverflow.silverBadges}\n`;
    developerProfile += `Bronze Badges: ${platformData.stackoverflow.bronzeBadges}\n`;
    developerProfile += `\n`;
  }

  const systemPrompt = `You are an expert AI Developer Advocate and Technical Recruiter.
Analyze the provided developer profile which aggregates data from multiple platforms (GitHub, LeetCode, Codeforces, StackOverflow).
Provide personalized, actionable AI-driven insights. Focus on:
1. Strengths: What makes this developer stand out?
2. Areas for Improvement: Where should they focus next to grow their skills?
3. Career Recommendation: Based on their profile, what roles or tech areas are they best suited for?

Format the response in clean, concise Markdown. Do NOT use overly verbose language. Keep it to 3-4 paragraphs.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: developerProfile },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    throw new Error('Failed to generate AI insights from OpenAI.');
  }
};

module.exports = {
  generateInsights,
};
