# Internationalization with OpenAI SDK

This project uses OpenAI API for real-time AI-powered translations.

## Setup

### 1. Configure API Key

Get an OpenAI API key and configure it:

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file:
   ```bash
   OPENAI_API_KEY="your-api-key-here"
   ```

**Note**: The translation service uses `gpt-4o-mini` model for cost-effective translations.

### 2. How It Works

The SDK-based approach provides:
- **Real-time translations**: Text is translated on-demand using OpenAI
- **Smart caching**: Translations are cached in memory to reduce API calls
- **Preloading**: Entire locales can be preloaded for better UX
- **Fallback handling**: Falls back to English if translation fails

## Adding New Translations

1. Add new keys to `locales/en.json`:
   ```json
   {
     "common": {
       "newKey": "New translation"
     }
   }
   ```

2. Use immediately in your components (translations happen automatically):
   ```tsx
   import { useContext } from 'react';
   import { LanguageContext } from '@/app/_context/LanguageContext';

   function MyComponent() {
     const { t } = useContext(LanguageContext);

     return <div>{t('common.newKey')}</div>;
   }
   ```

3. Translations are generated on-the-fly when users switch languages

## Supported Languages

- English (en) - Source language
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)
- Chinese (zh)
- Japanese (ja)
- Arabic (ar)
- Hindi (hi)

## Configuration

### Translation Service (`lib/i18n/translationService.ts`)
- Uses OpenAI `gpt-4o-mini` model
- In-memory caching for performance
- Handles nested objects and parameter replacement
- Temperature set to 0.3 for consistent translations

### Language Context (`app/_context/LanguageContext.tsx`)
- Provides language switching functionality
- Preloads translations for better UX
- Persists language preference in localStorage
- Exposes `t()` function for translations

### Source Locale (`locales/en.json`)
- Contains all English source strings
- Organized by feature/section
- Supports parameter placeholders like `{name}`, `{count}`

## Usage Examples

### Basic Translation
```tsx
const { t } = useContext(LanguageContext);
<h1>{t('common.welcome')}</h1>
```

### Translation with Parameters
```tsx
const { t } = useContext(LanguageContext);
<h1>{t('dashboard.welcomeMessage', { name: 'John' })}</h1>
// Output: "Welcome back, John!"
```

### Language Switching
The LanguageSelector component is already integrated in the dashboard header. Users can switch languages from the dropdown.

## Performance Notes

- **First load**: English is loaded immediately (no API calls)
- **Language switch**: Triggers preloading of entire locale (one-time cost)
- **Cached translations**: Reused across sessions in the same browser session
- **Fallback**: If translation fails, shows English text

## Cost Optimization

- Translations are cached in memory to minimize API calls
- Consider preloading common languages during off-peak hours
- Monitor OpenAI usage in the OpenAI dashboard
- `gpt-4o-mini` is the most cost-effective model for translations
