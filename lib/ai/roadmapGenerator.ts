import OpenAI from 'openai';
import { RoadmapStructure, PrerequisitesMap } from '@/Types/roadmap';
import {
  ROADMAP_GENERATION_PROMPT,
  PREREQUISITES_ANALYSIS_PROMPT,
  SKILL_LEVEL_PERSONALIZATION_PROMPT,
} from './roadmapPrompts';

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

async function createChatCompletion(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  responseFormat?: { type: 'json_object' },
  maxTokens: number = 4000,
  timeout: number = 120000, // 2 minutes for roadmap generation
  maxRetries: number = 2
) {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`Retrying API call (attempt ${attempt + 1}/${maxRetries + 1}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const response = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: maxTokens,
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
      
      if (attempt === maxRetries || (!isTimeout && !isRateLimit)) {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Failed to complete API request');
}

/**
 * Validates roadmap structure for loops and duplicates
 */
function validateRoadmapStructure(structure: RoadmapStructure): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const allIds: string[] = [];

  // Collect all IDs and check for duplicates
  structure.levels.forEach(level => {
    if (seenIds.has(level.id)) {
      errors.push(`Duplicate level ID: ${level.id}`);
    }
    seenIds.add(level.id);
    allIds.push(level.id);

    level.sections.forEach(section => {
      if (seenIds.has(section.id)) {
        errors.push(`Duplicate section ID: ${section.id}`);
      }
      seenIds.add(section.id);
      allIds.push(section.id);

      section.subtopics.forEach(subtopic => {
        if (seenIds.has(subtopic.id)) {
          errors.push(`Duplicate subtopic ID: ${subtopic.id}`);
        }
        seenIds.add(subtopic.id);
        allIds.push(subtopic.id);
      });
    });
  });

  // Check for circular dependencies in prerequisites
  // This is a simplified check - full cycle detection would require graph traversal
  // For now, we'll validate in the prerequisites analysis step

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a roadmap blueprint using AI
 */
export async function generateRoadmapBlueprint(
  topic: string,
  skillLevel: 'beginner' | 'intermediate' | 'pro'
): Promise<RoadmapStructure> {
  
  const prompt = `Generate a roadmap for: ${topic}
Target skill level: ${skillLevel}

Make sure the roadmap is comprehensive but appropriate for ${skillLevel} level learners.`;

  const messages = [
    {
      role: 'system' as const,
      content: ROADMAP_GENERATION_PROMPT + '\n\nReturn the result as valid JSON.',
    },
    {
      role: 'user' as const,
      content: `Generate a roadmap for: ${topic}\nTarget skill level: ${skillLevel}\n\nReturn the roadmap structure as JSON.`,
    },
  ];

  try {
    const response = await createChatCompletion(messages, { type: 'json_object' }, 6000, 120000);
    const text = await response.response.text();
    
    // Clean JSON string
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const structure: RoadmapStructure = JSON.parse(cleanedText);

    // Validate structure
    const validation = validateRoadmapStructure(structure);
    if (!validation.valid) {
      console.warn('Roadmap validation warnings:', validation.errors);
      // Continue anyway, but log warnings
    }

    // Calculate metadata
    let totalEstimatedHours = 0;
    let totalTopics = 0;

    structure.levels.forEach(level => {
      if (level.estimatedHours) {
        totalEstimatedHours += level.estimatedHours;
      }
      level.sections.forEach(section => {
        totalTopics += section.subtopics.length;
        if (section.estimatedHours) {
          totalEstimatedHours += section.estimatedHours;
        }
      });
    });

    structure.metadata = {
      totalEstimatedHours,
      totalTopics,
    };

    return structure;
  } catch (error) {
    console.error('Error generating roadmap blueprint:', error);
    throw new Error(`Failed to generate roadmap: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyzes prerequisites for a roadmap structure
 */
export async function analyzePrerequisites(structure: RoadmapStructure): Promise<PrerequisitesMap> {
  
  // Build a flat list of all topics with their IDs
  const topicsList: Array<{ id: string; title: string; type: string }> = [];
  
  structure.levels.forEach(level => {
    level.sections.forEach(section => {
      topicsList.push({
        id: section.id,
        title: section.title,
        type: 'section',
      });
      section.subtopics.forEach(subtopic => {
        topicsList.push({
          id: subtopic.id,
          title: subtopic.title,
          type: 'subtopic',
        });
      });
    });
  });

  const prompt = `Analyze prerequisites for this roadmap structure:

${JSON.stringify(structure, null, 2)}

Available topic IDs:
${topicsList.map(t => `- ${t.id}: ${t.title} (${t.type})`).join('\n')}`;

  const messages = [
    {
      role: 'system' as const,
      content: PREREQUISITES_ANALYSIS_PROMPT + '\n\nReturn the result as valid JSON.',
    },
    {
      role: 'user' as const,
      content: prompt + '\n\nReturn the prerequisites analysis as JSON.',
    },
  ];

  try {
    const response = await createChatCompletion(messages, { type: 'json_object' }, 4000, 90000);
    const text = await response.response.text();
    
    // Clean JSON string
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const result = JSON.parse(cleanedText);
    return result.prerequisites || {};
  } catch (error) {
    console.error('Error analyzing prerequisites:', error);
    // Return empty prerequisites map on error
    return {};
  }
}

/**
 * Personalizes roadmap based on skill level
 */
export async function personalizeRoadmap(
  structure: RoadmapStructure,
  skillLevel: 'beginner' | 'intermediate' | 'pro'
): Promise<RoadmapStructure> {
  
  const prompt = `Personalize this roadmap for skill level: ${skillLevel}

Current roadmap structure:
${JSON.stringify(structure, null, 2)}`;

  const messages = [
    {
      role: 'system' as const,
      content: SKILL_LEVEL_PERSONALIZATION_PROMPT + '\n\nReturn the result as valid JSON.',
    },
    {
      role: 'user' as const,
      content: prompt + '\n\nReturn the personalized roadmap structure as JSON.',
    },
  ];

  try {
    const response = await createChatCompletion(messages, { type: 'json_object' }, 6000, 120000);
    const text = await response.response.text();
    
    // Clean JSON string
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '');
    }

    const personalized: RoadmapStructure = JSON.parse(cleanedText);
    
    // Recalculate metadata
    let totalEstimatedHours = 0;
    let totalTopics = 0;

    personalized.levels.forEach(level => {
      if (level.estimatedHours) {
        totalEstimatedHours += level.estimatedHours;
      }
      level.sections.forEach(section => {
        totalTopics += section.subtopics.length;
        if (section.estimatedHours) {
          totalEstimatedHours += section.estimatedHours;
        }
      });
    });

    personalized.metadata = {
      totalEstimatedHours,
      totalTopics,
    };

    return personalized;
  } catch (error) {
    console.error('Error personalizing roadmap:', error);
    // Return original structure on error
    return structure;
  }
}

