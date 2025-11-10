Jeopardy 5x5 Grid (React + Vite)

This is a lightweight single-page Jeopardy-like grid implemented with React (JSX) and Vite.

Features
- 5 categories as column headings
- 5 rows of values (100..500) increasing downwards
- Click a tile to reveal the question
- "Reveal Answer" button to show the answer
- A 60-second timer starts when a question is opened
- Uses sessionStorage to persist which tiles have been used in the current browser session
- At first launch the site prompts you for the number of teams and creates default names (Team 1, Team 2, ...)
- A Teams panel shows each team's current points and provides +100 / -100 buttons which the host can use to update scores; double-click a team name to edit it and press Enter to finalize

Run locally (Windows PowerShell)

1. Install dependencies

```powershell
cd "d:\BebDev\jeopardy"
npm install
```

2. Start dev server

```powershell
npm run dev
```

Open the printed localhost URL in your browser to try the grid.

Notes
- This demo marks a tile used as soon as it's clicked (so you can't reuse it in the same session).
- Teams and setup state are persisted in sessionStorage for the browser session.
- The implementation is a demo and doesn't enforce formal buzzer rules or strict Jeopardy scoring (wagers, Daily Doubles) — I can add those next.

Files
- `index.html` - app entry
- `src/main.jsx` - React bootstrap
- `src/App.jsx` - main app and logic (timer, modal, sessionStorage)
- `src/styles.css` - styling
- `package.json` - scripts & deps

If you want, I can add: player score auto-assignment when selecting a tile, Daily Double support, or a buzzer input flow next.
