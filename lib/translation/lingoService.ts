import { db } from "@/config/db";
import { TRANSLATION_CACHE_TABLE } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from 'openai';

// Use OpenAI directly for runtime translations (same as Lingo.dev CLI uses)
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function translateText(
  text: string,
  targetLanguage: string,
  contentType: string = "general"
): Promise<string> {
  if (targetLanguage === "en" || !text || text.trim() === "") return text;
  
  // Check cache
  const cached = await db
    .select()
    .from(TRANSLATION_CACHE_TABLE)
    .where(
      and(
        eq(TRANSLATION_CACHE_TABLE.sourceText, text),
        eq(TRANSLATION_CACHE_TABLE.targetLanguage, targetLanguage)
      )
    )
    .limit(1);
  
  if (cached.length > 0) return cached[0].translatedText;
  
  // Use OpenAI for translation (same approach as Lingo.dev CLI)
  try {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not configured, skipping translation");
      return text;
    }

    // Map language codes to full names for better translation
    const languageMap: Record<string, string> = {
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'hi': 'Hindi',
      'zh': 'Chinese (Simplified)',
      'ja': 'Japanese',
    };

    const targetLangName = languageMap[targetLanguage] || targetLanguage;

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const completion = await Promise.race([
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text to ${targetLangName}. Only return the translated text, no explanations or additional text.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          temperature: 0.3, // Lower temperature for more consistent translations
          max_tokens: Math.min(Math.ceil(text.length * 2), 2000), // Estimate token count
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Translation timeout')), 15000)
        )
      ]);

      clearTimeout(timeoutId);
      
      const translated = completion.choices[0]?.message?.content?.trim() || text;
      
      // Cache result
      try {
        await db.insert(TRANSLATION_CACHE_TABLE).values({
          sourceText: text,
          targetLanguage,
          translatedText: translated,
          contentType,
        });
      } catch (cacheError) {
        // Don't fail if caching fails
        console.warn("Failed to cache translation:", cacheError);
      }
      
      return translated;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle errors gracefully
      if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
        console.warn(`Translation timeout, using original text`);
        return text;
      }
      throw fetchError;
    }
  } catch (error: any) {
    // Log error but don't throw - always return original text as fallback
    console.warn("Translation error (falling back to original text):", error?.message || error);
    return text;
  }
}

