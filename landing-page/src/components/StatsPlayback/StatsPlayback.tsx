import { useState, useEffect } from 'react';
import './StatsPlayback.css';

interface DayStats {
  date: string;
  files: number;
  minutes: number;
  words: number;
  memories: number;
  successRate: number;
}

const STATS_DATA: DayStats[] = [
  { date: 'Jan 8',  files: 6,  minutes: 42.5,  words: 6840,  memories: 47,  successRate: 100 },
  { date: 'Jan 15', files: 11, minutes: 78.3,  words: 12490, memories: 86,  successRate: 100 },
  { date: 'Jan 23', files: 14, minutes: 103.7, words: 16210, memories: 112, successRate: 92.9 },
  { date: 'Feb 1',  files: 8,  minutes: 55.2,  words: 8770,  memories: 61,  successRate: 100 },
  { date: 'Feb 7',  files: 9,  minutes: 64.8,  words: 10380, memories: 72,  successRate: 100 },
  { date: 'Feb 12', files: 13, minutes: 91.6,  words: 14530, memories: 101, successRate: 100 },
];

const CYCLE_MS = 4000;

interface StatsPlaybackProps {
  accentColor: string;
}

export function StatsPlayback({ accentColor }: StatsPlaybackProps) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % STATS_DATA.length);
        setFading(false);
      }, 300);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  const stats = STATS_DATA[index];
  const style = { '--accent': accentColor } as React.CSSProperties;

  return (
    <div className="stats-playback" style={style}>
      <div className="stats-playback__header">
        <span className="stats-playback__label">Daily Transcription Stats</span>
        <span className="stats-playback__date">{stats.date}</span>
      </div>
      <div className={`stats-playback__grid ${fading ? 'stats-playback__grid--fading' : ''}`}>
        <div className="stats-playback__stat">
          <span className="stats-playback__value">{stats.files}</span>
          <span className="stats-playback__unit">files</span>
        </div>
        <div className="stats-playback__stat">
          <span className="stats-playback__value">{stats.minutes.toFixed(1)}</span>
          <span className="stats-playback__unit">minutes</span>
        </div>
        <div className="stats-playback__stat">
          <span className="stats-playback__value">{stats.words.toLocaleString()}</span>
          <span className="stats-playback__unit">words</span>
        </div>
        <div className="stats-playback__stat">
          <span className="stats-playback__value">{stats.memories}</span>
          <span className="stats-playback__unit">memories</span>
        </div>
        <div className="stats-playback__stat">
          <span className="stats-playback__value">{stats.successRate}%</span>
          <span className="stats-playback__unit">success</span>
        </div>
      </div>
      <div className="stats-playback__dots">
        {STATS_DATA.map((_, i) => (
          <span
            key={i}
            className={`stats-playback__dot ${i === index ? 'stats-playback__dot--active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
