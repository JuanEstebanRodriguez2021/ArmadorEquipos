# Paridad — Team Builder

Paridad is a single-page web application for organizing amateur football (soccer) matches. You register the players attending a match, and the app does one of two things:

- **Two teams:** splits the players into two teams with the closest possible average rating.
- **One team:** picks the best starting line-up for the chosen format and puts everyone else on the bench.

Both modes show the line-up on a pitch view, and you can adjust the teams manually.

**Live demo:** [armadorequiposparidad.vercel.app](https://armadorequiposparidad.vercel.app)

The UI was designed in Figma Make and implemented with React, TypeScript and Vite.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Supported Formats](#supported-formats)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [Author](#author)

---

## Features

- **Player roster.** Add players with a name, position (goalkeeper, defender, midfielder, forward) and skill level (5–10), and remove them. The roster starts empty.
- **One or two teams.** Build a single team with substitutes, or two balanced teams.
- **Match formats.** Five-, six-, seven-, eight- and eleven-a-side (F5, F6, F7, F8, F11), available in both modes.
- **Team customization.** Rename each team and pick any color, either with the color picker or by typing a hex code (for example `#F2D230`). The color is applied to the jerseys, tabs, bars and squad lists.
- **Formation selection.** Choose a formation for each format. In two-team mode each team can have its own formation.
- **Pitch view.** Shows the line-up in a suggested formation for the selected format, with each player's full name. Long names wrap onto two lines.
- **Rating indicators.**
  - Two-team mode shows a 0–100 balance score and the rating difference between the teams.
  - One-team mode shows the team's average level.
- **Manual adjustments.** Move players between the two teams, or between starters and substitutes.
- **Responsive layout.** Three columns on desktop, two on tablets and one on mobile.

## Tech Stack

| Layer      | Technology                      |
| ---------- | ------------------------------- |
| UI library | React 19                        |
| Language   | TypeScript 5 (strict mode)      |
| Build tool | Vite 7                          |
| Styling    | Tailwind CSS 4 + plain CSS      |
| Fonts      | DM Sans, Manrope (Google Fonts) |
| Hosting    | Vercel                          |

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

   Open [http://localhost:3491](http://localhost:3491). The page reloads automatically when you edit the source files.

   The port is fixed to **3491** in `vite.config.ts` (`strictPort: true`). If the port is already in use, the server exits with an error rather than switching to another port.

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

| Command           | Description                                                                |
| ----------------- | -------------------------------------------------------------------------- |
| `npm run dev`     | Starts the Vite development server on port 3491 with hot module reloading. |
| `npm run build`   | Runs the TypeScript type-check, then builds to `dist/`.                    |
| `npm run preview` | Serves the contents of `dist/` locally on port 3491.                       |

## Project Structure

All source files live in the project root. There is no `src/` folder.

```
ArmadorEquipos/
├── index.html        # HTML entry point (loads /main.tsx)
├── main.tsx          # React entry point
├── app.tsx           # Application components and logic
├── index.css         # Global styles, design tokens and responsive rules
├── vite-env.d.ts     # Vite type declarations
├── favicon.svg       # App icon
├── vite.config.ts    # Vite configuration (React + Tailwind plugins, port 3491)
├── tsconfig.json     # TypeScript configuration
├── package.json      # Dependencies and scripts
└── .gitignore        # Excludes node_modules and dist
```

## How It Works

### Player rating

Each player gets a **rating** that weights skill above physical condition:

```
rating = skill × 0.7 + fitness × 0.3
```

New players get a default fitness of 7.

### Two-team mode

Requires at least `2 × team size` players. When teams are generated, the app:

1. Sorts the roster by rating, highest first, and takes the top `2 × team size` players.
2. Puts the two best goalkeepers on different teams.
3. Assigns each remaining player to the team with the lower total rating, until each team is full.

The **balance score** compares the two teams' average ratings:

```
balance = max(0, round(100 − |averageTeam1 − averageTeam2| × 18))
```

| Score | Label           |
| ----- | --------------- |
| ≥ 90  | Very even       |
| 75–89 | Well balanced   |
| < 75  | Could be better |

### One-team mode

Requires at least `team size` players. When the team is generated, the app:

1. Sorts the roster by rating, highest first.
2. Fills each slot of the selected formation with the best available player for that position.
3. Fills any slot that has no player for its position with the best remaining player.
4. Puts everyone else on the bench as substitutes.

Players added after the team is generated join the bench automatically. The team level is the starters' average rating on a 0–100 scale.

### Team names and colors

Teams start with no name and no color; each group sets their own in the **Personaliza tus equipos** card. Until then, the teams are labeled *Equipo 1* and *Equipo 2* (or *Tu equipo* in one-team mode) and shown in a neutral gray. Names can have up to 20 characters. Colors are passed to the stylesheet as the CSS variables `--team-a` and `--team-b`, and light tints are derived with `color-mix()`. The jersey text switches between white and dark depending on the color's luminance, so initials stay readable on light colors. In one-team mode only the first team can be customized, and the bench uses a neutral gray.

The UI shows all labels in Spanish.

## Supported Formats

Formations are written without the goalkeeper. The first line is defenders, the last line is forwards, and any lines in between are midfielders.

| Format | Players per team | Available formations (first one is the default) |
| ------ | ---------------- | ----------------------------------------------- |
| F5     | 5                | 2-2  |
| F6     | 6                | 2-2-1, 2-1-2 |
| F7     | 7                | 2-2-2, 3-2-1, 2-3-1, 2-1-3, 3-1-2 |
| F8     | 8                | 3-2-2, 3-3-1, 2-3-2, 3-1-3, 2-4-1, 4-2-1, 4-1-2, 2-2-3, 3-1-2-1, 3-2-1-1, 2-3-1-1, 2-1-3-1 |
| F11    | 11               | 4-3-3, 4-4-2, 4-2-3-1, 4-5-1, 4-1-4-1, 4-4-1-1, 4-3-2-1, 4-3-1-2, 4-1-2-1-2, 4-2-2-2, 4-1-3-2, 4-2-4, 3-5-2, 3-4-3, 3-4-1-2, 3-4-2-1, 3-1-4-2, 3-5-1-1, 3-3-3-1, 5-3-2, 5-4-1, 5-2-3, 5-2-1-2 |

Formations with up to six options are shown as buttons; F8 and F11 use a drop-down list. Changing the format resets both teams to that format's default formation.

On the pitch, players are placed in slots that match their position first. Any remaining slots are filled with the players left over, and those slots are labeled with both roles; for example, `DEL (MED)` is a midfielder playing as a forward. The list of formations is defined in `formationOptions` in `app.tsx`.

The **Generate** button stays disabled until the roster has enough players for the selected mode and format.

## Deployment

The app is deployed on **Vercel** and connected to this GitHub repository. Every push to `main` triggers a new production deployment automatically.

Vercel project settings:

| Setting          | Value           |
| ---------------- | --------------- |
| Framework preset | Vite            |
| Build command    | `npm run build` |
| Output directory | `dist`          |
| Install command  | `npm install`   |

To deploy your own copy:

1. Fork this repository.
2. In Vercel, select **Add New → Project** and import the fork.
3. Keep the settings above and select **Deploy**.

Because `npm run build` produces a fully static site, `dist/` can also be hosted on any other static hosting service.

## Known Limitations

- **No persistence.** The roster, teams, names and colors reset when the page is reloaded.
- **Fitness is fixed for new players.** The add-player form sets skill only; fitness defaults to 7.
- **Spanish only.** The interface is in Spanish.

## Contributing

1. Fork the repository and create a feature branch: `git checkout -b feature/my-change`.
2. Make your changes and confirm that `npm run build` completes without errors.
3. Commit with a descriptive message and open a pull request.

## Author

**Juan Esteban Rodriguez**

- GitHub: [@JuanEstebanRodriguez2021](https://github.com/JuanEstebanRodriguez2021)