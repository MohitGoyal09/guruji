import { db } from "@/config/db";
import { TRANSLATION_CACHE_TABLE } from "@/config/schema";
import { eq, and } from "drizzle-orm";

export async function translateText(
  text: string,
  targetLanguage: string,
  contentType: string = "general"
): Promise<string> {
  if (targetLanguage === "en") return text;
  
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
  
  // Call Lingo.dev API
  try {
    const response = await fetch("https://api.lingo.dev/v1/translate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LINGO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
        source_language: "en",
        project_id: process.env.LINGO_PROJECT_ID,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const translated = data.translated_text || data.text || text;
    
    // Cache result
    await db.insert(TRANSLATION_CACHE_TABLE).values({
      sourceText: text,
      targetLanguage,
      translatedText: translated,
      contentType,
    });
    
    return translated;
  } catch (error) {
    console.error("Translation error:", error);
    // Fallback: return original text if translation fails
    return text;
  }
}

