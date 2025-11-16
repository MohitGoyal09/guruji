import { NextResponse } from "next/server";
import { LingoDotDevEngine } from "lingo.dev/sdk";

// Initialize Lingo.dev SDK (server-side only)
const lingoDotDev = new LingoDotDevEngine({
  apiKey: process.env.NEXT_PUBLIC_LINGO_API_KEY || "",
  batchSize: 100,
  idealBatchItemSize: 1000,
});

// In-memory cache for translations
const translationCache = new Map<string, any>();

function getCacheKey(content: any, targetLocale: string): string {
  return `${JSON.stringify(content)}_${targetLocale}`;
}

export async function POST(req: Request) {
  console.log("🌐 Translation API called");

  try {
    const { content, targetLocale, type } = await req.json();

    console.log("📝 Translation request:", {
      targetLocale,
      type,
      contentLength: Array.isArray(content) ? content.length : typeof content,
      hasApiKey: !!process.env.NEXT_PUBLIC_LINGO_API_KEY,
      apiKeyPreview: process.env.NEXT_PUBLIC_LINGO_API_KEY?.substring(0, 10) + "..."
    });

    if (!content || !targetLocale) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Return original content if target is English
    if (targetLocale === "en") {
      console.log("✅ Target is English, returning original content");
      return NextResponse.json({ translated: content });
    }

    // Check cache
    const cacheKey = getCacheKey(content, targetLocale);
    if (translationCache.has(cacheKey)) {
      console.log("📦 Cache hit - returning cached translation");
      return NextResponse.json({ translated: translationCache.get(cacheKey) });
    }

    console.log("🔄 Starting translation...");
    let translated;

    try {
      if (type === "array" && Array.isArray(content)) {
        console.log(`📚 Translating array of ${content.length} items`);
        // Translate array of items
        translated = await Promise.all(
          content.map(async (item, index) => {
            console.log(`  → Translating item ${index + 1}/${content.length}`);
            const result = await lingoDotDev.localizeObject(item, {
              sourceLocale: "en",
              targetLocale,
            });
            console.log(`  ✓ Item ${index + 1} translated`);
            return result;
          })
        );
      } else if (type === "object") {
        console.log("📄 Translating single object");
        // Translate single object
        translated = await lingoDotDev.localizeObject(content, {
          sourceLocale: "en",
          targetLocale,
        });
      } else {
        console.log("📝 Translating text");
        // Translate text
        translated = await lingoDotDev.localizeText(content, {
          sourceLocale: "en",
          targetLocale,
        });
      }

      console.log("✅ Translation completed successfully");

      // Cache the result
      translationCache.set(cacheKey, translated);
      console.log("💾 Translation cached");

      return NextResponse.json({ translated });
    } catch (translationError: any) {
      // Check if error is due to free plan limit
      const errorMessage = translationError?.message || "";
      const isPlanLimitError = 
        errorMessage.includes("Maximum number of translated words") ||
        errorMessage.includes("free plan reached") ||
        errorMessage.includes("Please upgrade");

      if (isPlanLimitError) {
        console.warn("⚠️ Translation limit reached, returning original content:", {
          message: errorMessage,
          targetLocale,
          type,
        });
        
        // Return original content as fallback
        // Cache the original content to avoid retrying
        translationCache.set(cacheKey, content);
        
        return NextResponse.json({ 
          translated: content,
          warning: "Translation limit reached. Original content returned.",
        });
      }
      
      // Re-throw other errors to be caught by outer catch
      throw translationError;
    }
  } catch (error: any) {
    console.error("❌ Translation error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { error: "Translation failed: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
