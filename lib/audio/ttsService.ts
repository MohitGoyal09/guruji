import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('NEXT_PUBLIC_OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export async function generateNarration(
  text: string,
  language: string,
  outputPath: string
): Promise<string> {
  const voice = getVoiceForLanguage(language);
  
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice,
    input: text,
    speed: 0.95,
  });
  
  const buffer = Buffer.from(await mp3.arrayBuffer());
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });
  
  await fs.writeFile(outputPath, buffer);
  
  return outputPath;
}

function getVoiceForLanguage(lang: string): 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' {
  const voiceMap: Record<string, 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'> = {
    en: 'nova',
    es: 'shimmer',
    fr: 'alloy',
    de: 'onyx',
    hi: 'fable',
    zh: 'echo',
  };
  return voiceMap[lang] || 'nova';
}

