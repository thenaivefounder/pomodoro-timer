import PomodoroTimer from '@/components/PomodoroTimer';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-amber-950/10">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div></div> {/* Spacer for centering */}
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              🍅 Pomodoro Timer
            </h1>
            <ThemeToggle />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Boost your productivity with the Pomodoro Technique
          </p>
        </div>
        <PomodoroTimer />
      </div>
    </main>
  );
}
