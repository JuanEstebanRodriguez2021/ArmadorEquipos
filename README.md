# Paridad — Balanced Team Builder

Paridad is a single-page web application for organizing amateur football (soccer) matches. It lets you register the players attending a match, then splits them into two teams with the closest possible average rating. You can see each team on a pitch view and adjust the line-ups manually.

The UI was designed in Figma Make and implemented with React, TypeScript and Vite.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [How the Balancing Works](#how-the-balancing-works)
- [Supported Formats](#supported-formats)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [Collaborators](#collaborators)

---

## Features

- **Player roster.** Add players with a name, position (goalkeeper, defender, midfielder, forward) and skill level (5–10), and remove them.
- **Match formats.** Five-, six-, seven-, eight- and eleven-a-side (F5, F6, F7, F8, F11).
- **Automatic team generation.** Splits the roster into two balanced teams, *Blue* and *Coral*.
- **Pitch view.** Shows each team in a suggested formation for the selected format.
- **Balance indicator.** A 0–100 balance score, the rating difference between the teams, and a bar comparison.
- **Manual adjustments.** Move any player to the other team from the squad list.
- **Responsive layout.** Three columns on desktop, two on tablets and one on mobile.

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| UI library | React 19                       |
| Language   | TypeScript 5 (strict mode)     |
| Build tool | Vite 7                         |
| Styling    | Tailwind CSS 4 + plain CSS     |
| Fonts      | DM Sans, Manrope (Google Fonts) |

The application has no backend or database. All state lives in memory in the browser.

## Prerequisites

- **Node.js** 20.19+ or 22.12+ (required by Vite 7)
- **npm** 10+ (bundled with recent Node.js versions)

Check your versions with:

```bash
node -v
npm -v
```

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/JuanEstebanRodriguez2021/ArmadorEquipos.git
   cd ArmadorEquipos
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   Open the URL printed in the terminal (by default `http://localhost:3491`). The page reloads automatically when you edit the source files.

4. **Build for production**

   ```bash
   npm run build
   ```

   This type-checks the project and writes an optimized static build to `dist/`.

5. **Preview the production build locally**

   ```bash
   npm run preview
   ```

## Available Scripts

| Command           | Description                                                  |
| ----------------- | ------------------------------------------------------------ |
| `npm run dev`     | Starts the Vite development server with hot module reloading. |
| `npm run build`   | Runs the TypeScript type-check, then builds to `dist/`.       |
| `npm run preview` | Serves the contents of `dist/` locally.                       |

## Project Structure

```
ArmadorEquipos/
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration (React + Tailwind plugins, "@" alias)
├── public/
│   └── favicon.svg     # App icon
└── src/
    ├── main.tsx        # React entry point
    ├── App.tsx         # Application components and logic
    ├── index.css       # Global styles, design tokens and responsive rules
    └── vite-env.d.ts   # Vite type declarations
```

The `@/` import alias resolves to `src/`.

## How the Balancing Works

Each player gets a **rating** that weights skill above physical condition:

```
rating = skill × 0.7 + fitness × 0.3
```

New players get a default fitness of 7.

When teams are generated, the app:

1. Sorts the roster by rating, highest first, and takes the top `2 × team size` players.
2. Puts the two best goalkeepers on different teams.
3. Assigns each remaining player to the team with the lower total rating, until each team is full.

The **balance score** compares the two teams' average ratings:

```
balance = max(0, round(100 − |averageBlue − averageCoral| × 18))
```

| Score  | Label           |
| ------ | --------------- |
| ≥ 90   | Very even       |
| 75–89  | Well balanced   |
| < 75   | Could be better |

The UI shows these labels in Spanish.

## Supported Formats

| Format | Players per team | Suggested formation (GK-DEF-MID-FWD) |
| ------ | ---------------- | ------------------------------------ |
| F5     | 5                | 1-2-0-2                              |
| F6     | 6                | 1-2-2-1                              |
| F7     | 7                | 1-2-2-2                              |
| F8     | 8                | 1-3-2-2                              |
| F11    | 11               | 1-4-3-3                              |

The **Generate** button stays disabled until the roster has at least `2 × team size` players.

## Deployment

`npm run build` produces a fully static site, so `dist/` can be hosted on any static hosting service.

### Vercel / Netlify

Import the repository and use these settings:

- **Build command:** `npm run build`
- **Output directory:** `dist`

### GitHub Pages

GitHub Pages serves the site from a sub-path (`/ArmadorEquipos/`). Set the `base` option in `vite.config.ts` before building:

```ts
export default defineConfig({
  base: '/ArmadorEquipos/',
  // ...
})
```

Then publish the contents of `dist/`, for example with a GitHub Actions workflow or the `gh-pages` package.

## Known Limitations

- **No persistence.** The roster and teams reset when the page is reloaded.
- **Fitness is fixed for new players.** The add-player form sets skill only; fitness defaults to 7.
- **Spanish only.** The interface is in Spanish.

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/my-change`.
2. Make your changes and confirm that `npm run build` completes without errors.
3. Commit with a descriptive message and open a pull request.

## Collaborators

- Juan Esteban Rodríguez Céspedes

