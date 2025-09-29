# SmashBoard

A desktop application for managing badminton recreational sessions, tracking player statistics, and calculating ELO ratings.

## Features

- **Player Management**: Add and manage players with their main characters
- **Match Tracking**: Record match results with automatic ELO calculation
- **ELO Rating System**: Comprehensive ranking system based on match performance
- **Leaderboards**: View player rankings and statistics
- **SQLite Database**: Local data storage with better-sqlite3
- **Desktop App**: Built with Electron for cross-platform compatibility

## Tech Stack

- **Frontend**: Next.js 14 with React 18 & TypeScript
- **Desktop**: Electron with electron-builder
- **Database**: SQLite with better-sqlite3
- **Styling**: Tailwind CSS
- **Testing**: Jest with ts-jest

## Project Structure

```
smashboard/
├── src/app/              # Next.js app router pages and components
├── electron/             # Electron main process files
│   ├── main.ts          # Main electron process
│   ├── preload.ts       # Preload script for IPC
│   └── utils.ts         # Utility functions
├── db/                   # Database layer
│   ├── database.ts      # Database connection and setup
│   ├── playerRepository.ts # Player CRUD operations
│   └── matchRepository.ts  # Match CRUD operations
├── models/               # Data models
│   ├── Player.ts        # Player model and interface
│   ├── Match.ts         # Match model and interface
│   └── Elo.ts           # ELO calculation utilities
├── tests/                # Jest test files
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <this-repository-url>
cd smashboard
```

2. Install dependencies:
```bash
npm install
```

### Development

1. Start the development server:
```bash
npm run dev
```

This will start both the Next.js development server and Electron app concurrently.

2. The app will open automatically in Electron, but you can also access it in your browser at `http://localhost:3000`

### Building

1. Build the application:
```bash
npm run build
```

2. Create platform-specific distributables:
```bash
npm run dist        # Build for current platform
npm run dist:mac    # Build for macOS
npm run dist:win    # Build for Windows
npm run dist:linux  # Build for Linux
```

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Scripts

- `npm run dev` - Start development environment (Next.js + Electron)
- `npm run build` - Build the complete application
- `npm run dist` - Create platform distributables
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Database Schema

### Players Table
- `id` - Primary key
- `name` - Player's real name
- `tag` - Player's gamertag/handle
- `main_character` - Primary character
- `secondary_character` - Secondary character (optional)
- `elo` - Current ELO rating
- `wins` - Total wins
- `losses` - Total losses
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

### Matches Table
- `id` - Primary key
- `player1_id`, `player2_id` - Foreign keys to players
- `player1_character`, `player2_character` - Characters used
- `player1_score`, `player2_score` - Match scores
- `winner_id`, `loser_id` - Foreign keys to winner/loser
- `stage` - Stage played on (optional)
- `match_type` - Type of match (friendly, tournament, ranked)
- `notes` - Additional notes (optional)
- `created_at` - Match timestamp

## ELO System

The app implements a standard ELO rating system:

- **Starting ELO**: 1200
- **K-Factor**: 32 (standard), 40 (new players), 16 (high-rated players)
- **Rating Tiers**: Beginner (0-1199), Class D (1200-1399), Class C (1400-1599), Class B (1600-1799), Class A (1800-1999), Expert (2000-2199), Master (2200-2399), Grand Master (2400+)

