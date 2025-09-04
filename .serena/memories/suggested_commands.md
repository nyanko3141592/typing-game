# Suggested Development Commands

## Basic System Commands (macOS)
```bash
# File operations
ls -la                    # List files with details
find . -name "*.js"       # Find JavaScript files
grep -r "function" .      # Search for functions in code

# Git operations
git status               # Check working directory status
git add .               # Stage all changes
git commit -m "message" # Commit with message
git log --oneline       # View commit history
git branch             # List branches
git checkout -b feature/name # Create new feature branch
```

## Development Workflow
```bash
# Local development
open index.html         # Open main game in browser
open good-feeling-conversion.html # Open demo page

# Testing manually
# - Open index.html in browser
# - Test typing game functionality
# - Test responsive design on different screen sizes
# - Verify localStorage rankings work
# - Test IME context recognition with Japanese input

# Code validation
# No formal linting - manual code review
# Check console for JavaScript errors
# Test in multiple browsers (Safari, Chrome, Firefox)
```

## Project-Specific Commands
```bash
# View game questions
cat questions.json      # Check game question data

# Check file structure
tree .                 # View project structure (if tree installed)

# Live development (simple HTTP server)
python3 -m http.server 8000  # Serve locally on :8000
# OR
npx serve .            # If npx available

# GitHub Pages deployment
# Push to main branch - automatic deployment
git push origin main
```

## No Build Process
This project requires **NO BUILD TOOLS**:
- No npm/yarn dependencies
- No webpack/rollup/vite
- No transpilation needed
- Direct browser deployment
- Pure HTML/CSS/JS development

## Testing Strategy
Since no formal testing framework:
- Manual browser testing
- Cross-browser compatibility checks
- Mobile device testing
- IME functionality verification on Japanese systems
- localStorage functionality testing