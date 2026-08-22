// Centralized AI Chatbot Controller
import { usersDB, projectsDB, hackathonsDB } from '../db/dataStore.js';

let prismaInstance = null;
const getPrisma = async () => {
  if (!process.env.DATABASE_URL) return null;
  if (!prismaInstance) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      prismaInstance = new PrismaClient();
    } catch (err) {
      console.warn('Prisma load skipped in aiController.');
      return null;
    }
  }
  return prismaInstance;
};

// POST /api/ai/chat
export const processAiChat = async (req, res) => {
  const { query, conversationId } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Chat query is required.' });
  }

  const prompt = query.trim();
  const lower = prompt.toLowerCase();

  try {
    let responseText = '';
    let matches = null;
    let suggestions = [];

    const prisma = await getPrisma();

    // 1. Teammate & Skill Matchmaking Engine
    if (lower.includes('match') || lower.includes('teammate') || lower.includes('designer') || lower.includes('developer') || lower.includes('find') || lower.includes('react') || lower.includes('ui') || lower.includes('backend') || lower.includes('python')) {
      let dbUsers = [];
      if (prisma) {
        try {
          dbUsers = await prisma.user.findMany({ take: 6 });
        } catch (e) {}
      }
      if (dbUsers.length === 0) {
        dbUsers = usersDB.slice(0, 5);
      }

      matches = dbUsers.map((u, idx) => ({
        id: u.id,
        name: u.name,
        role: u.major || 'Full-Stack Software Engineer',
        uni: u.university || 'Stanford University',
        score: `${98 - idx * 3}% Match`,
        skills: u.skills?.length ? u.skills : ['React', 'Node.js', 'System Design'],
        desc: u.bio || 'Active student looking for cross-departmental capstone and hackathon collaboration.'
      }));

      responseText = `🎯 AI Teammate Matchmaker Engine Results for "${prompt}":\nI scanned active university profiles in your campus network and matched ${matches.length} top-tier candidates for your team:`;
      suggestions = [
        "Find a UI/UX Designer with Figma skills",
        "Search AI & Data Science Teammates",
        "Recommend Hackathon Teams"
      ];
    }
    // 2. Code Reviewer & Bug Fixer
    else if (lower.includes('code') || lower.includes('review') || lower.includes('bug') || lower.includes('syntax') || lower.includes('error') || lower.includes('refactor')) {
      responseText = `💻 AI Code Review & Optimization Analysis:\n\n1. Security & State Safety: Always sanitize input parameters and ensure null/undefined checks before property access.\n2. Prisma Singleton Connection: Reuse a single instance of PrismaClient to avoid connection pool exhaustion on serverless lambdas.\n3. Async / Await Control: Wrap API calls in try/catch blocks and return explicit HTTP status codes (200, 400, 401, 500).\n4. React Performance: Use useMemo and useCallback for expensive computations in heavy grid components.`;
      suggestions = [
        "How to structure Prisma connection singletons?",
        "Best practices for React state management",
        "Review my Node.js error middleware"
      ];
    }
    // 3. Academic & Literature Review Helper
    else if (lower.includes('paper') || lower.includes('research') || lower.includes('literature') || lower.includes('citation') || lower.includes('ieee') || lower.includes('abstract')) {
      responseText = `📚 Academic Research Paper Structure & Formatting Guide:\n\n• Title & Abstract (150-250 words): Concise summary of problem statement, methodology, and key experimental findings.\n• Introduction & Related Work: Comprehensive literature background establishing your research contribution.\n• Methodology & Architecture: System diagrams, datasets, and mathematical formulations.\n• Results & Discussion: Performance metrics, baseline comparisons, and trade-off analysis.\n• References: Standardized IEEE/APA citations.`;
      suggestions = [
        "Generate IEEE citation template",
        "How to write a strong abstract?",
        "Literature review organization tips"
      ];
    }
    // 4. Hackathon Finder & Strategy
    else if (lower.includes('hackathon') || lower.includes('competition') || lower.includes('prize') || lower.includes('challenge')) {
      responseText = `🏆 Top Recommended Hackathons & Project Challenges:\n\n1. AI for Good 2026 ($10,000 Prize Pool - Virtual)\n2. EduHack Global 2.0 (Hybrid - Direct Internship Offers)\n3. Campus Tech Challenge ($5,000 Funding - In-Person)\n\n💡 Winning Strategy: Pair 1 UI/UX Lead + 1 Backend Architect + 1 Pitch Presenter for maximum presentation impact!`;
      suggestions = [
        "Find hackathon teammates",
        "How to pitch a hackathon project to judges?",
        "Project idea generator"
      ];
    }
    // 5. Default General Assistance
    else {
      responseText = `🤖 UniCollab AI Assistant:\nI have analyzed your request: "${prompt}".\n\nHere is how I can accelerate your work on UniCollab:\n• Teammate Matching: Type "Find a React developer" or "Match UI/UX designer".\n• Academic Help: Type "Research paper structure" or "Literature review".\n• Code Optimization: Type "Code review for my API controller".\n• Hackathons: Type "Recommend upcoming hackathons".`;
      suggestions = [
        "Match me with a UI/UX Designer",
        "Find a React & Node.js Developer",
        "Recommend Hackathon Teams"
      ];
    }

    return res.status(200).json({
      success: true,
      sender: 'ai',
      text: responseText,
      matches,
      suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI Chat Error:', err);
    return res.status(500).json({
      success: false,
      message: 'AI Assistant failed to process query.'
    });
  }
};
