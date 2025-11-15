# PowerShell script for Lingo.dev CLI translations

Write-Host "Setting up Lingo.dev for translations..." -ForegroundColor Green

# Check if OPENAI_API_KEY is set
if (-not $env:OPENAI_API_KEY -and -not $env:NEXT_PUBLIC_OPENAI_API_KEY) {
    Write-Host "Warning: OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY not found in environment" -ForegroundColor Yellow
    Write-Host "Please set it before running translations:" -ForegroundColor Yellow
    Write-Host "  `$env:OPENAI_API_KEY='your_key_here'" -ForegroundColor Yellow
    Write-Host "  or" -ForegroundColor Yellow
    Write-Host "  `$env:NEXT_PUBLIC_OPENAI_API_KEY='your_key_here'" -ForegroundColor Yellow
}

# Set OPENAI_API_KEY from NEXT_PUBLIC_OPENAI_API_KEY if needed
if (-not $env:OPENAI_API_KEY -and $env:NEXT_PUBLIC_OPENAI_API_KEY) {
    $env:OPENAI_API_KEY = $env:NEXT_PUBLIC_OPENAI_API_KEY
    Write-Host "Using NEXT_PUBLIC_OPENAI_API_KEY as OPENAI_API_KEY" -ForegroundColor Cyan
}

# Run Lingo.dev CLI to translate locale files
Write-Host "Running Lingo.dev CLI to translate locale files..." -ForegroundColor Green
npx --yes lingo.dev@latest i18n

Write-Host "Translation complete! Check locales/ directory for translated files." -ForegroundColor Green

