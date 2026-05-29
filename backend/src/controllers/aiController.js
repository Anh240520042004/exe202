import AIChat from '../models/AIChat.js';
import User from '../models/User.js';
import { apiSuccess, apiError } from '../utils/apiResponse.js';
import { openai } from '../config/openai.js';

export const createChat = async (req, res, next) => {
  try {
    const { subject = 'General', title } = req.body;

    const chat = await AIChat.create({
      user: req.user.id,
      subject,
      title: title || `New ${subject} Chat`
    });

    res.status(201).json(apiSuccess(chat, 'Chat created'));
  } catch (error) {
    next(error);
  }
};

export const getChats = async (req, res, next) => {
  try {
    const chats = await AIChat.find({ user: req.user.id, isActive: true })
      .select('title subject lastMessageAt createdAt')
      .sort({ lastMessageAt: -1 });

    res.json(apiSuccess(chats));
  } catch (error) {
    next(error);
  }
};

export const getChatById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await AIChat.findOne({ _id: id, user: req.user.id });

    if (!chat) {
      return next(apiError('Chat not found', 404));
    }

    res.json(apiSuccess(chat));
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, subject } = req.body;

    const chat = await AIChat.findOne({ _id: id, user: req.user.id });

    if (!chat) {
      return next(apiError('Chat not found', 404));
    }

    chat.messages.push({
      role: 'user',
      content,
      timestamp: new Date()
    });

    let assistantResponse = '';
    let tokenUsage = { input: 0, output: 0 };

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(subject || chat.subject)
          },
          ...chat.messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      assistantResponse = response.choices[0].message.content;
      tokenUsage = {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens
      };
    } catch (openaiError) {
      assistantResponse = getFallbackResponse(content);
    }

    chat.messages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date()
    });

    chat.tokenUsage.input += tokenUsage.input;
    chat.tokenUsage.output += tokenUsage.output;
    chat.tokenUsage.total += tokenUsage.input + tokenUsage.output;
    chat.lastMessageAt = new Date();

    await chat.save();

    const lastMessage = chat.messages[chat.messages.length - 1];

    res.json(apiSuccess({
      message: lastMessage,
      tokenUsage
    }));
  } catch (error) {
    next(error);
  }
};

export const deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const chat = await AIChat.findOne({ _id: id, user: req.user.id });

    if (!chat) {
      return next(apiError('Chat not found', 404));
    }

    chat.isActive = false;
    await chat.save();

    res.json(apiSuccess(null, 'Chat deleted'));
  } catch (error) {
    next(error);
  }
};

export const summarizePdf = async (req, res, next) => {
  try {
    const { text, subject } = req.body;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an academic assistant. Summarize the provided document content concisely. Focus on key concepts, main points, and important details. Format the summary with clear sections. Subject context: ${subject || 'General'}`
          },
          {
            role: 'user',
            content: `Please summarize this document:\n\n${text}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.5
      });

      res.json(apiSuccess({
        summary: response.choices[0].message.content,
        tokens: response.usage.total_tokens
      }));
    } catch (openaiError) {
      res.json(apiSuccess({
        summary: 'PDF summarization requires OpenAI API configuration.',
        tokens: 0
      }));
    }
  } catch (error) {
    next(error);
  }
};

export const generateFlashcards = async (req, res, next) => {
  try {
    const { content, subject, count = 5 } = req.body;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an educational assistant. Generate flashcards from the provided content. Return a JSON array with objects containing "question" and "answer" fields. Generate exactly ${count} flashcards. Subject: ${subject || 'General'}`
          },
          {
            role: 'user',
            content: `Generate ${count} flashcards from this content:\n\n${content}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      let flashcards;
      try {
        flashcards = JSON.parse(response.choices[0].message.content);
      } catch {
        flashcards = parseFlashcardsFromText(response.choices[0].message.content);
      }

      res.json(apiSuccess({
        flashcards,
        tokens: response.usage.total_tokens
      }));
    } catch (openaiError) {
      res.json(apiSuccess({
        flashcards: [],
        error: 'Flashcard generation requires OpenAI API configuration.'
      }));
    }
  } catch (error) {
    next(error);
  }
};

export const generateQuiz = async (req, res, next) => {
  try {
    const { content, subject, count = 5, type = 'multiple_choice' } = req.body;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an educational assistant. Generate a quiz from the provided content. Return a JSON array with question objects. For multiple choice, include 4 options with correct answer index. Subject: ${subject || 'General'}`
          },
          {
            role: 'user',
            content: `Generate ${count} ${type} questions from this content:\n\n${content}`
          }
        ],
        max_tokens: 2500,
        temperature: 0.7
      });

      let quiz;
      try {
        quiz = JSON.parse(response.choices[0].message.content);
      } catch {
        quiz = [];
      }

      res.json(apiSuccess({
        quiz,
        tokens: response.usage.total_tokens
      }));
    } catch (openaiError) {
      res.json(apiSuccess({
        quiz: [],
        error: 'Quiz generation requires OpenAI API configuration.'
      }));
    }
  } catch (error) {
    next(error);
  }
};

export const explainCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a programming tutor. Explain the provided code clearly, covering its purpose, how it works, and key concepts. Use examples where helpful.'
          },
          {
            role: 'user',
            content: `Explain this ${language || ''} code:\n\n\`\`\`\n${code}\n\`\`\``
          }
        ],
        max_tokens: 1500,
        temperature: 0.5
      });

      res.json(apiSuccess({
        explanation: response.choices[0].message.content,
        tokens: response.usage.total_tokens
      }));
    } catch (openaiError) {
      res.json(apiSuccess({
        explanation: 'Code explanation requires OpenAI API configuration.',
        tokens: 0
      }));
    }
  } catch (error) {
    next(error);
  }
};

export const generateStudyRoadmap = async (req, res, next) => {
  try {
    const { subject, targetDate, currentLevel = 'beginner' } = req.body;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an academic study planner. Create a detailed study roadmap with daily/weekly tasks to help prepare for exams. Include milestones and checkpoints.'
          },
          {
            role: 'user',
            content: `Create a study roadmap for ${subject || 'this subject'}.\nTarget exam date: ${targetDate || 'Not specified'}\nCurrent level: ${currentLevel}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      res.json(apiSuccess({
        roadmap: response.choices[0].message.content,
        tokens: response.usage.total_tokens
      }));
    } catch (openaiError) {
      res.json(apiSuccess({
        roadmap: 'Roadmap generation requires OpenAI API configuration.',
        tokens: 0
      }));
    }
  } catch (error) {
    next(error);
  }
};

export const getSuggestedPrompts = async (req, res, next) => {
  try {
    const { subject } = req.query;

    const prompts = {
      General: [
        'Explain this concept in simple terms',
        'Give me an example of this topic',
        'What are the key points I should remember?',
        'Create a practice question for me'
      ],
      SWP391: [
        'Explain software design patterns',
        'How do I implement MVC architecture?',
        'What are SOLID principles?',
        'Help me understand UML diagrams'
      ],
      PRJ301: [
        'Explain Agile methodology',
        'How do I write a good user story?',
        'What is the difference between Scrum and Kanban?',
        'Help me create a project timeline'
      ],
      DBI202: [
        'Explain SQL JOIN types',
        'How do I optimize database queries?',
        'What is database normalization?',
        'Help me understand ER diagrams'
      ],
      MAD101: [
        'Explain React useState hook',
        'How do I implement navigation in React Native?',
        'What are the best practices for mobile UI?',
        'Help me debug this React component'
      ]
    };

    const suggestedPrompts = prompts[subject] || prompts.General;

    res.json(apiSuccess(suggestedPrompts));
  } catch (error) {
    next(error);
  }
};

function getSystemPrompt(subject) {
  const prompts = {
    SWP391: 'You are a software engineering expert specializing in SWP391 (Software Engineering). Help with design patterns, architecture, and best practices.',
    PRJ301: 'You are a project management expert specializing in PRJ301 (Project Management). Help with methodologies, planning, and execution.',
    DBI202: 'You are a database expert specializing in DBI202 (Database). Help with SQL, data modeling, and optimization.',
    MAD101: 'You are a mobile development expert specializing in MAD101 (Mobile App Development). Help with React Native, UI/UX, and deployment.',
    General: 'You are a helpful academic assistant. Help explain concepts, answer questions, and provide learning guidance.'
  };

  return prompts[subject] || prompts.General;
}

function getFallbackResponse(question) {
  return "I'm here to help! To use the AI assistant, please configure GEMINI_API_KEY or OPENAI_API_KEY in the backend .env file, then restart the backend server.";
}

function parseFlashcardsFromText(text) {
  const flashcards = [];
  const lines = text.split('\n');
  let currentQuestion = '';
  let currentAnswer = '';

  for (const line of lines) {
    if (line.match(/^\d+\./)) {
      if (currentQuestion) {
        flashcards.push({ question: currentQuestion, answer: currentAnswer });
      }
      currentQuestion = line.replace(/^\d+\.\s*/, '').trim();
      currentAnswer = '';
    } else if (line.toLowerCase().startsWith('answer:')) {
      currentAnswer = line.replace(/^answer:\s*/i, '').trim();
    } else if (currentAnswer) {
      currentAnswer += ' ' + line.trim();
    }
  }

  if (currentQuestion) {
    flashcards.push({ question: currentQuestion, answer: currentAnswer });
  }

  return flashcards;
}
