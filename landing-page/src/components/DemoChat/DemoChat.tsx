import { useState, useEffect, useRef } from 'react';
import './DemoChat.css';

interface MediaCard {
  title: string;
  year: number;
  rating: string;
  genres: string[];
}

interface DemoMessage {
  role: 'user' | 'assistant';
  text: string;
  media?: MediaCard[];
  delay: number;
}

const CONVERSATION: DemoMessage[] = [
  {
    role: 'user',
    text: 'What should I watch tonight?',
    delay: 1200,
  },
  {
    role: 'assistant',
    text: 'Based on your Plex watch history, here are some picks:',
    media: [
      { title: 'Severance', year: 2022, rating: '8.7', genres: ['Sci-Fi', 'Thriller'] },
      { title: 'Shogun', year: 2024, rating: '8.7', genres: ['Drama', 'History'] },
      { title: 'The Bear', year: 2022, rating: '8.6', genres: ['Comedy', 'Drama'] },
    ],
    delay: 2500,
  },
  {
    role: 'user',
    text: 'Search for Dune Part Two',
    delay: 3500,
  },
  {
    role: 'assistant',
    text: "Found Dune: Part Two (2024) \u2014 not in your library yet. Want me to request it through Ombi?",
    delay: 2000,
  },
  {
    role: 'user',
    text: 'Yes please!',
    delay: 2000,
  },
  {
    role: 'assistant',
    text: "Done! Submitted a request for Dune: Part Two. You\u2019ll get a notification when it\u2019s ready.",
    delay: 1500,
  },
];

interface DemoChatProps {
  accentColor: string;
}

export function DemoChat({ accentColor }: DemoChatProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= CONVERSATION.length) {
      const timer = setTimeout(() => {
        setIsTyping(false);
        setVisibleCount(0);
      }, 6000);
      return () => clearTimeout(timer);
    }

    const msg = CONVERSATION[visibleCount];

    if (msg.role === 'assistant') {
      const typingStart = Math.max(msg.delay - 1200, 300);
      const t1 = setTimeout(() => setIsTyping(true), typingStart);
      const t2 = setTimeout(() => {
        setIsTyping(false);
        setVisibleCount((c) => c + 1);
      }, msg.delay);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    const timer = setTimeout(() => setVisibleCount((c) => c + 1), msg.delay);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [visibleCount, isTyping]);

  const style = { '--accent': accentColor } as React.CSSProperties;

  return (
    <div className="demo-chat" style={style}>
      <div className="demo-chat__header">
        <span className="demo-chat__title">Ralf</span>
        <span className="demo-chat__label">Demo Conversation</span>
      </div>
      <div className="demo-chat__messages" ref={scrollRef}>
        {CONVERSATION.slice(0, visibleCount).map((msg, i) => (
          <div key={i} className={`demo-chat__msg demo-chat__msg--${msg.role}`}>
            <div className="demo-chat__bubble">{msg.text}</div>
            {msg.media && (
              <div className="demo-chat__media">
                {msg.media.map((m, j) => (
                  <div key={j} className="demo-chat__card">
                    <div className="demo-chat__poster" />
                    <div className="demo-chat__card-info">
                      <span className="demo-chat__card-title">{m.title}</span>
                      <span className="demo-chat__card-meta">
                        {m.year} &middot; &#9733; {m.rating}
                      </span>
                      <div className="demo-chat__card-genres">
                        {m.genres.map((g) => (
                          <span key={g} className="demo-chat__genre">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="demo-chat__msg demo-chat__msg--assistant">
            <div className="demo-chat__typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
