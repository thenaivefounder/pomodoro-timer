'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Pause, RotateCcw, Settings, Clock, Volume2, Bell } from 'lucide-react';

interface PomodoroSession {
  id: string;
  type: 'work' | 'break';
  duration: number;
  startTime: Date;
  endTime: Date;
  completed: boolean;
}

interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
  audioEnabled: boolean;
  notificationsEnabled: boolean;
}

export default function PomodoroTimer() {
  // Settings
  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    audioEnabled: true,
    notificationsEnabled: true,
  });

  // Timer state
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  
  // Session tracking
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);
  
  // Settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(settings);

  // Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionRef = useRef<() => void>(() => {});

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  };

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Play audio alert
  const playAudio = useCallback((type: 'work' | 'break') => {
    if (!settings.audioEnabled) return;

    try {
      // Check if AudioContext is supported
      if (typeof window === 'undefined' || !window.AudioContext && !(window as any).webkitAudioContext) {
        console.warn('AudioContext not supported');
        return;
      }

      // Create audio context for different tones
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for work vs break
      if (type === 'work') {
        // Work session complete - higher, more alert tone
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
        oscillator.frequency.setValueAtTime(1108, audioContext.currentTime + 0.1); // C#6
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2); // A5
      } else {
        // Break complete - lower, gentler tone
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime + 0.2); // C5
      }

      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Audio not supported or failed:', error);
    }
  }, [settings.audioEnabled]);

  // Show browser notification
  const showNotification = useCallback((completedType: 'work' | 'break', nextType: 'work' | 'shortBreak' | 'longBreak') => {
    if (!settings.notificationsEnabled || notificationPermission !== 'granted') return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const completedText = completedType === 'work' ? 'Work Session' : 'Break';
    const nextText = nextType === 'work' ? 'Work Session' : 
                    nextType === 'shortBreak' ? 'Short Break' : 'Long Break';
    
    const title = `${completedText} Complete! 🍅`;
    const body = `Time for a ${nextText.toLowerCase()}. Click to return to timer.`;
    const icon = completedType === 'work' ? '🍅' : '☕';

    try {
      const notification = new Notification(title, {
        body,
        icon: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="30" fill="#ef4444"/>
            <text x="32" y="42" text-anchor="middle" font-size="32">${icon}</text>
          </svg>
        `),
        badge: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="15" fill="#ef4444"/>
            <text x="16" y="21" text-anchor="middle" font-size="16">🍅</text>
          </svg>
        `),
        requireInteraction: true,
        tag: 'pomodoro-timer'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } catch (error) {
      console.warn('Notification failed:', error);
    }
  }, [settings.notificationsEnabled, notificationPermission]);

  // Calculate current session duration
  const getCurrentDuration = () => {
    switch (currentMode) {
      case 'work':
        return settings.workDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
      default:
        return settings.workDuration * 60;
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate estimated completion time
  const getEstimatedCompletion = () => {
    if (!currentSessionStart || !isActive) return null;
    
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000);
    const totalDuration = getCurrentDuration();
    const remaining = totalDuration - elapsed;
    
    if (remaining <= 0) return null;
    
    const completionTime = new Date(now.getTime() + remaining * 1000);
    return completionTime;
  };

  // Start/stop timer
  const toggleTimer = async () => {
    if (!isActive) {
      setCurrentSessionStart(new Date());
      
      // Request notification permission on first start
      if (settings.notificationsEnabled && notificationPermission === 'default') {
        await requestNotificationPermission();
      }
    }
    setIsActive(!isActive);
  };

  // Reset timer
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getCurrentDuration());
    setCurrentSessionStart(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // Complete current session and move to next
  const completeSession = useCallback(() => {
    if (!currentSessionStart) return;

    const endTime = new Date();
    const newSession: PomodoroSession = {
      id: Date.now().toString(),
      type: currentMode === 'work' ? 'work' : 'break',
      duration: getCurrentDuration(),
      startTime: currentSessionStart,
      endTime,
      completed: true,
    };

    // Check if a session with the same start time already exists to prevent duplicates
    setSessions(prev => {
      const existingSession = prev.find(session => 
        session.startTime.getTime() === currentSessionStart.getTime()
      );
      if (existingSession) {
        console.warn('Duplicate session detected, skipping');
        return prev;
      }
      return [newSession, ...prev];
    });

    const completedType = currentMode === 'work' ? 'work' : 'break';
    let nextMode: 'work' | 'shortBreak' | 'longBreak';

    if (currentMode === 'work') {
      setCompletedSessions(prev => prev + 1);
      // Determine next break type
      const nextCount = completedSessions + 1;
      if (nextCount % settings.sessionsUntilLongBreak === 0) {
        nextMode = 'longBreak';
        setCurrentMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        nextMode = 'shortBreak';
        setCurrentMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
      }
    } else {
      nextMode = 'work';
      setCurrentMode('work');
      setTimeLeft(settings.workDuration * 60);
    }

    // Trigger notifications
    playAudio(completedType);
    showNotification(completedType, nextMode);

    setIsActive(false);
    setCurrentSessionStart(null);
  }, [currentSessionStart, currentMode, completedSessions, settings, playAudio, showNotification]);

  // Update the completion ref whenever completeSession changes
  useEffect(() => {
    completionRef.current = completeSession;
  }, [completeSession]);

  // Timer effect
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Use a timeout to ensure completeSession is called only once
            // and after the current render cycle, using ref to avoid stale closures
            setTimeout(() => {
              if (completionRef.current) {
                completionRef.current();
              }
            }, 0);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]); // Removed completeSession from dependencies

  // Update timer when mode changes
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(getCurrentDuration());
    }
  }, [currentMode, settings]);

  // Save settings
  const saveSettings = () => {
    setSettings(tempSettings);
    setSettingsOpen(false);
    if (!isActive) {
      setTimeLeft(tempSettings.workDuration * 60);
    }
  };

  // Test notification
  const testNotification = () => {
    if (notificationPermission === 'granted') {
      showNotification('work', 'shortBreak');
    } else {
      requestNotificationPermission();
    }
  };

  // Test audio
  const testAudio = () => {
    playAudio('work');
  };

  // Calculate progress percentage
  const progress = ((getCurrentDuration() - timeLeft) / getCurrentDuration()) * 100;

  // Get theme colors based on current mode
  const getProgressColor = () => {
    switch (currentMode) {
      case 'work':
        return 'stroke-red-500'; // Tomato red for work
      case 'shortBreak':
        return 'stroke-green-500'; // Green for short break
      case 'longBreak':
        return 'stroke-blue-500'; // Blue for long break
      default:
        return 'stroke-red-500';
    }
  };

  const getModeIcon = () => {
    switch (currentMode) {
      case 'work':
        return '🍅'; // Tomato for work
      case 'shortBreak':
        return '☕'; // Coffee for short break
      case 'longBreak':
        return '🌴'; // Palm tree for long break
      default:
        return '🍅';
    }
  };

  const getBadgeVariant = () => {
    switch (currentMode) {
      case 'work':
        return 'default'; // Will use our new tomato primary
      case 'shortBreak':
      case 'longBreak':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Main Timer Card */}
      <Card className="relative overflow-hidden border-red-200 dark:border-red-800/30">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                <Badge variant={getBadgeVariant()}>
                  {getModeIcon()} {currentMode === 'work' ? 'Work Session' : 
                   currentMode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Session {completedSessions + 1}
                </span>
              </div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Timer Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="work-duration">Work Duration (minutes)</Label>
                    <Input
                      id="work-duration"
                      type="number"
                      min="1"
                      max="60"
                      value={tempSettings.workDuration}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        workDuration: parseInt(e.target.value) || 25
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="short-break">Short Break (minutes)</Label>
                    <Input
                      id="short-break"
                      type="number"
                      min="1"
                      max="30"
                      value={tempSettings.shortBreakDuration}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        shortBreakDuration: parseInt(e.target.value) || 5
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="long-break">Long Break (minutes)</Label>
                    <Input
                      id="long-break"
                      type="number"
                      min="1"
                      max="60"
                      value={tempSettings.longBreakDuration}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        longBreakDuration: parseInt(e.target.value) || 15
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessions-until-long">Sessions Until Long Break</Label>
                    <Input
                      id="sessions-until-long"
                      type="number"
                      min="2"
                      max="8"
                      value={tempSettings.sessionsUntilLongBreak}
                      onChange={(e) => setTempSettings(prev => ({
                        ...prev,
                        sessionsUntilLongBreak: parseInt(e.target.value) || 4
                      }))}
                    />
                  </div>
                  
                  <Separator />
                  
                  {/* Notification Settings */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Notifications</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Volume2 className="w-4 h-4" />
                        <Label htmlFor="audio-enabled">Audio Alerts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="audio-enabled"
                          type="checkbox"
                          checked={tempSettings.audioEnabled}
                          onChange={(e) => setTempSettings(prev => ({
                            ...prev,
                            audioEnabled: e.target.checked
                          }))}
                          className="rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={testAudio}
                          disabled={!tempSettings.audioEnabled}
                        >
                          Test
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4" />
                        <Label htmlFor="notifications-enabled">Browser Notifications</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="notifications-enabled"
                          type="checkbox"
                          checked={tempSettings.notificationsEnabled}
                          onChange={(e) => setTempSettings(prev => ({
                            ...prev,
                            notificationsEnabled: e.target.checked
                          }))}
                          className="rounded"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={testNotification}
                          disabled={!tempSettings.notificationsEnabled}
                        >
                          {notificationPermission === 'granted' ? 'Test' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                    
                    {notificationPermission === 'denied' && tempSettings.notificationsEnabled && (
                      <p className="text-sm text-amber-600">
                        Notifications are blocked. Please enable them in your browser settings.
                      </p>
                    )}
                  </div>
                  
                  <Button onClick={saveSettings} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Circular Progress */}
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-muted-foreground/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={`${getProgressColor()} transition-all duration-1000 ease-in-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-2">{getModeIcon()}</div>
                <div className="text-4xl font-bold">{formatTime(timeLeft)}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(progress)}% complete
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              className="w-24"
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              onClick={resetTimer}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Session Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {currentSessionStart && (
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Started: {currentSessionStart.toLocaleTimeString()}</span>
              </div>
            )}
            {getEstimatedCompletion() && (
              <div className="flex items-center justify-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Ends: {getEstimatedCompletion()?.toLocaleTimeString()}</span>
              </div>
            )}
            <div className="flex items-center justify-center space-x-2">
              <span>Completed: {completedSessions} sessions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Log */}
      <Card>
        <CardHeader>
          <CardTitle>Session Log</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              🍅 No sessions completed yet. Start your first Pomodoro!
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div key={session.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <Badge variant={session.type === 'work' ? 'default' : 'secondary'}>
                        {session.type === 'work' ? '🍅 Work' : '☕ Break'}
                      </Badge>
                      <span className="font-medium">
                        {Math.round(session.duration / 60)} minutes
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()} - {session.endTime.toLocaleTimeString()}
                    </div>
                  </div>
                  {index < sessions.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 