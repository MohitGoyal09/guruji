import OpenAI from 'openai';

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

// Helper function to create a chat completion with retry logic
async function createChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  responseFormat?: { type: 'json_object' },
  maxTokens: number = 4000,
  timeout: number = 60000, // Default 60 seconds, configurable per call
  maxRetries: number = 2
) {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: wait 2^attempt seconds before retry
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retrying API call (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency and speed
          messages: messages,
          temperature: 0.7, // Lower temperature for faster, more consistent responses
          max_tokens: maxTokens, // Reduced from 8192 to speed up generation
          ...(responseFormat && { response_format: responseFormat }),
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Request timeout after ${timeout / 1000} seconds`)), timeout)
        )
      ]);

      const content = response.choices[0]?.message?.content || '';
      
      return {
        response: {
          text: () => Promise.resolve(content),
        },
      };
    } catch (error) {
      lastError = error as Error;
      const isTimeout = error instanceof Error && error.message.includes('timeout');
      const isRateLimit = error instanceof Error && (error.message.includes('429') || error.message.includes('rate limit'));
      
      console.error(`OpenAI API error (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      // Don't retry on timeout if it's the last attempt, or if it's not a timeout/rate limit error
      if (attempt === maxRetries || (!isTimeout && !isRateLimit)) {
        throw error;
      }
      
      // Continue to retry for timeout and rate limit errors
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Failed to complete API request');
}

// Course Outline Generator
export const courseOutline = {
  async sendMessage(prompt: string) {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are an educational content generator. Generate course outlines in JSON format with: course_title, course_summary, difficulty, and chapters array. Each chapter should have chapter_number, chapter_title, chapter_summary, and topics array. Respond with valid JSON only, no markdown.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    return createChatCompletion(messages, { type: 'json_object' }, 3000);
  },
};

// Notes Generator
export const generateNotes = {
  async sendMessage(prompt: string) {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert educational content creator specializing in creating comprehensive, well-structured study notes for students.

Your task is to generate detailed, high-quality study notes for a single chapter in HTML format. The notes should be:
- Comprehensive: Cover all topics mentioned in the chapter
- Well-structured: Use proper HTML headings (h1, h2, h3), paragraphs, lists, and code blocks
- Educational: Include explanations, examples, and key concepts
- Exam-focused: Emphasize important points that would be useful for exams
- Clear and readable: Use proper formatting, spacing, and visual hierarchy

HTML Formatting Guidelines:
- Use <h1> for chapter title
- Use <h2> for main topics/sections
- Use <h3> for subtopics
- Use <p> for paragraphs
- Use <ul> and <ol> for lists
- Use <pre><code> for code examples
- Use <strong> for emphasis on important terms
- Use <em> for emphasis
- Do NOT include <html>, <head>, <body>, or <title> tags
- Escape special characters properly

Return ONLY valid JSON in this exact structure:
{
  "notes": {
    "html_content": "<h1>Chapter Title</h1><h2>Topic 1</h2><p>Content...</p>..."
  }
}

The html_content should be a complete, well-formatted HTML string containing all the chapter content.`,
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    // Use longer timeout (90 seconds) and more tokens for comprehensive notes
    return createChatCompletion(messages, { type: 'json_object' }, 6000, 90000, 2);
  },
};

// Study Type Content Generator (Flashcards)
export const GenerateStudyTypeContent = {
  async sendMessage(prompt: string) {
    const messages = [
      {
        role: 'system' as const,
        content: 'Generate flashcards as JSON array with "front" and "back" keys (max 15 items). Respond with valid JSON only.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    return createChatCompletion(messages, { type: 'json_object' }, 2000);
  },
};

// Quiz Generator
export const GenerateQuizAiModel = {
  async sendMessage(prompt: string) {
    const messages = [
      {
        role: 'system' as const,
        content: 'Generate quizzes as JSON with "quizTitle" and "questions" array (max 10). Each question needs questionId, question, options array, and correctAnswer. Respond with valid JSON only.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    return createChatCompletion(messages, { type: 'json_object' }, 2000);
  },
};

// Q&A Generator
export const GenerateQuestionAiModel = {
  async sendMessage(prompt: string) {
    const messages = [
      {
        role: 'system' as const,
        content: 'Generate Q&A pairs as JSON array with "question" and "answer" keys (max 20 pairs). Respond with valid JSON only.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    return createChatCompletion(messages, { type: 'json_object' }, 2500);
  },
};

// Video Script Generator
export const GenerateVideoScript = {
  async sendMessage(prompt: string) {
    const messages = [
      {
        role: 'system' as const,
        content: 'Generate video script JSON with: duration (90-180s), narration (string), scenes array. Each scene: start, end (seconds), type (title/concept/code), title, content, code (if type=code), points (if type=concept). Respond with valid JSON only.',
      },
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    return createChatCompletion(messages, { type: 'json_object' }, 3000);
  },
};
