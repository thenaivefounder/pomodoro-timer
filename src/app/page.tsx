import PomodoroTimer from '@/components/PomodoroTimer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Pomodoro Timer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Boost your productivity with the Pomodoro Technique
          </p>
        </div>
        <PomodoroTimer />
      </div>
    </main>
  );
}
