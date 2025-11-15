#!/bin/bash
# Setup script for Lingo.dev CLI translations

echo "Setting up Lingo.dev for translations..."

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ] && [ -z "$NEXT_PUBLIC_OPENAI_API_KEY" ]; then
    echo "Warning: OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY not found in environment"
    echo "Please set it before running translations:"
    echo "  export OPENAI_API_KEY=your_key_here"
    echo "  or"
    echo "  export NEXT_PUBLIC_OPENAI_API_KEY=your_key_here"
fi

# Run Lingo.dev CLI to translate locale files
echo "Running Lingo.dev CLI to translate locale files..."
npx --yes lingo.dev@latest i18n

echo "Translation complete! Check locales/ directory for translated files."

