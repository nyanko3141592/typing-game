# Project Structure

## Root Directory Files
```
typing-game/
├── index.html                     # Main typing game page
├── good-feeling-conversion.html   # AI conversion demo page
├── script.js                     # Main game logic (600+ lines)
├── good-feeling-conversion.js     # Demo page logic
├── styles.css                    # Shared styles for both pages
├── questions.json                # Game questions and answers data
├── screenshot.png               # Game screenshot for documentation
├── README.md                    # Project documentation (Japanese)
└── docs/
    └── specification.md          # Detailed technical specification
```

## Code Organization

### script.js Structure
- **Game State Variables**: Global variables for game state management
- **DOM Element References**: Cached DOM elements with `El` suffix
- **Initialization Functions**: `initializePage()`, `initializeElements()`, `setupEventListeners()`
- **Game Logic**: `startGame()`, `loadQuestion()`, `checkAnswer()`, `endGame()`
- **Utility Functions**: `shuffleArray()`, `containsKanji()`, `convertToKanji()`
- **Ranking System**: `saveRanking()`, `getRankings()`, `displayRankings()`
- **UI Management**: Various show/hide functions for different screens

### styles.css Organization
- **Global Reset**: Universal CSS reset
- **Base Styles**: Typography, colors, layouts
- **Component Styles**: Organized by UI component
- **Responsive Design**: Media queries for mobile adaptation
- **Animations**: CSS transitions and animations

### questions.json Structure
```json
{
  "questions": [
    {
      "context": "雑誌に",
      "expectedAnswer": "載ります",
      "reading": "のります"
    }
    // ... more questions
  ]
}
```

## Key Architecture Patterns
- **Event-driven UI**: All interactions handled through event listeners
- **State management**: Global JavaScript variables for game state
- **DOM manipulation**: Direct DOM API usage (no frameworks)
- **Local data persistence**: localStorage for rankings
- **Module pattern**: Functions grouped by functionality

## File Dependencies
- `index.html` → `script.js` + `styles.css` + `questions.json`
- `good-feeling-conversion.html` → `good-feeling-conversion.js` + `styles.css`
- Both pages share `styles.css` for consistent styling