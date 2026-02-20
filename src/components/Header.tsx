'use client';

import { useState, useEffect } from 'react';

interface HeaderProps {
  onUpload?: () => void;
}

export default function Header({ onUpload }: HeaderProps) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Top classification bar */}
      <div className="flex justify-between items-center px-5 py-1.5 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[10px] text-[var(--text-dim)] tracking-wider hidden md:flex">
        <div className="flex gap-4 items-center">
          <span className="px-2 py-0.5 bg-[var(--amber)] text-[var(--bg-primary)] font-bold text-[9px] tracking-[2px]">PERSONAL</span>
          <span>SYS HEALTH MONITOR v2.1</span>
        </div>
        <span>{time}</span>
      </div>

      {/* Main header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-secondary)] border-b-2 border-[var(--amber)]">
        <div>
          <h1 className="text-xl md:text-[22px] font-bold text-[var(--amber)] tracking-[6px] uppercase" style={{ fontFamily: "'Rajdhani', sans-serif", textShadow: '0 0 20px var(--amber-dim)' }}>
            RECON
          </h1>
          <span className="text-[10px] font-medium tracking-[3px] text-[var(--text-dim)] block -mt-0.5" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            Health Intelligence System
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onUpload && (
            <button
              onClick={onUpload}
              className="px-3 py-1.5 text-[10px] font-semibold tracking-[1px] uppercase border border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}
            >
              ↑ Upload
            </button>
          )}
          <div className="text-right text-[11px] text-[var(--text-dim)]">
            <span className="text-[var(--green)] font-semibold">● ONLINE</span>
            <br />
            <span className="hidden sm:inline">{date}</span>
          </div>
        </div>
      </div>
    </>
  );
}
