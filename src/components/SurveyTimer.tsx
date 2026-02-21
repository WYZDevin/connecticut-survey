import { useState, useEffect } from 'react';
import { useSurvey } from '../hooks/useSurvey';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export default function SurveyTimer() {
  const { state } = useSurvey();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - state.startTime);
    }, 1000);
    return () => clearInterval(id);
  }, [state.startTime]);

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm font-mono text-gray-600 z-50">
      {formatTime(elapsed)}
    </div>
  );
}
