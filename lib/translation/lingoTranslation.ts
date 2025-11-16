"use client";

/**
 * Translate text to target language using API
 */
export async function translateText(
  text: string,
  targetLocale: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!text || targetLocale === "en") return text;

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: text,
        targetLocale,
        type: "text",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Translation failed");
    }

    // Log warning if translation limit was reached
    if (data.warning) {
      console.warn("⚠️ Translation warning:", data.warning);
    }

    if (onProgress) onProgress(100);
    return data.translated;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text on error
  }
}

/**
 * Translate an object with nested properties using API
 */
export async function translateObject<T>(
  obj: T,
  targetLocale: string,
  onProgress?: (progress: number) => void
): Promise<T> {
  if (!obj || targetLocale === "en") return obj;

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: obj,
        targetLocale,
        type: "object",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Translation failed");
    }

    // Log warning if translation limit was reached
    if (data.warning) {
      console.warn("⚠️ Translation warning:", data.warning);
    }

    if (onProgress) onProgress(100);
    return data.translated;
  } catch (error) {
    console.error("Translation error:", error);
    return obj; // Return original object on error
  }
}

/**
 * Translate an array of items using API
 */
export async function translateArray<T>(
  items: T[],
  targetLocale: string,
  onProgress?: (progress: number) => void
): Promise<T[]> {
  console.log("🔄 [Client] translateArray called:", {
    itemCount: items?.length,
    targetLocale,
    hasProgress: !!onProgress,
  });

  if (!items || items.length === 0 || targetLocale === "en") {
    console.log("⏭️ [Client] Skipping translation:", {
      noItems: !items || items.length === 0,
      isEnglish: targetLocale === "en",
    });
    return items;
  }

  try {
    const totalItems = items.length;
    const batchSize = 5; // Process in smaller batches for better progress tracking
    const translatedItems: T[] = [];

    console.log(`📦 [Client] Processing ${totalItems} items in batches of ${batchSize}`);

    for (let i = 0; i < totalItems; i += batchSize) {
      const batch = items.slice(i, Math.min(i + batchSize, totalItems));

      console.log(`🔄 [Client] Translating batch ${Math.floor(i / batchSize) + 1} (${batch.length} items)`);

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: batch,
          targetLocale,
          type: "array",
        }),
      });

      const data = await response.json();

      console.log(`📥 [Client] Response received:`, {
        ok: response.ok,
        status: response.status,
        hasTranslated: !!data.translated,
        error: data.error,
        warning: data.warning,
      });

      if (!response.ok) {
        throw new Error(data.error || "Translation failed");
      }

      // Log warning if translation limit was reached
      if (data.warning) {
        console.warn("⚠️ Translation warning:", data.warning);
      }

      translatedItems.push(...data.translated);

      if (onProgress) {
        const progress = Math.round(
          (Math.min(i + batchSize, totalItems) / totalItems) * 100
        );
        console.log(`📊 [Client] Progress: ${progress}%`);
        onProgress(progress);
      }
    }

    console.log("✅ [Client] Translation complete:", {
      originalCount: totalItems,
      translatedCount: translatedItems.length,
    });

    return translatedItems;
  } catch (error: any) {
    console.error("❌ [Client] Translation error:", {
      message: error?.message,
      error,
    });
    return items; // Return original items on error
  }
}
