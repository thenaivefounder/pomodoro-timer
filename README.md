# Pomodoro Timer Web App

A modern, responsive Pomodoro Timer built with Next.js 15, TypeScript, and shadcn/ui components.

## Features

### Core Functionality
- ✅ **Start/Stop Timer**: Easy-to-use controls to start, pause, and reset the timer
- ✅ **Customizable Times**: Adjust work sessions, short breaks, and long breaks duration
- ✅ **Session Tracking**: Displays start time and estimated completion time
- ✅ **Session Log**: Complete history of all completed Pomodoro sessions

### Advanced Features
- 🎯 **Smart Break Management**: Automatically cycles between work and break sessions
- 📊 **Progress Visualization**: Beautiful circular progress indicator
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- ⚙️ **Flexible Settings**: Customize all timer durations and break patterns
- 📱 **Mobile Friendly**: Works seamlessly on desktop and mobile devices

## How to Use

### Getting Started
1. Click the **Start** button to begin a 25-minute work session
2. The timer will count down and show your progress
3. When the session completes, it automatically switches to a break period
4. Continue cycling through work and break sessions

### Customizing Settings
1. Click the **Settings** gear icon in the top-right
2. Adjust the following options:
   - **Work Duration**: Length of work sessions (1-60 minutes)
   - **Short Break**: Length of short breaks (1-30 minutes)
   - **Long Break**: Length of long breaks (1-60 minutes)
   - **Sessions Until Long Break**: How many work sessions before a long break (2-8)

### Session Information
- **Start Time**: Shows when the current session began
- **Estimated End**: Displays when the current session will complete
- **Completed Sessions**: Total number of work sessions finished

### Session Log
The bottom section shows a complete history of your productivity:
- Work sessions and break periods are clearly marked
- Each entry shows duration, start time, and end time
- Sessions are ordered from most recent to oldest

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Turbopack (for fast development)

## Development

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Other Commands
```bash
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Home page
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── PomodoroTimer.tsx    # Main timer component
└── lib/
    └── utils.ts             # Utility functions
```

## Features in Detail

### Timer Modes
- **Work Session**: Default 25-minute focused work period
- **Short Break**: 5-minute break between work sessions
- **Long Break**: 15-minute extended break after every 4 work sessions

### Visual Feedback
- Circular progress ring shows session progress
- Color-coded badges indicate current session type
- Real-time countdown display with percentage completion

### Session Management
- Automatic progression from work to break sessions
- Manual start/pause/reset controls
- Smart break type selection (short vs. long break)

### Data Persistence
- Session history persists during the browser session
- Settings are maintained across timer cycles
- No data is stored on servers (client-side only)

## Browser Compatibility

This app works on all modern browsers that support:
- ES6+ JavaScript features
- CSS Grid and Flexbox
- SVG animations
- Local storage

## Contributing

This is a demonstration project showcasing modern React/Next.js development practices with TypeScript and shadcn/ui components.

## License

MIT License - feel free to use this code for your own projects!
