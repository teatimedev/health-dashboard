'use client';

import { PersonalRecord } from '@/lib/types';

interface PersonalRecordsProps {
  records: PersonalRecord[];
  stepStreak: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PersonalRecords({ records, stepStreak }: PersonalRecordsProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 animate-fade-in" style={{ animationDelay: '0.9s' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {records.map((record, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-secondary)] border-l-2 border-[var(--amber)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <span className="text-sm">{record.icon}</span>
            <div>
              <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider">{record.label}</div>
              <div className="text-sm font-bold text-[var(--amber)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {typeof record.value === 'number' ? record.value.toLocaleString() : record.value}
                {record.unit && <span className="text-[10px] text-[var(--text-dim)] ml-1">{record.unit}</span>}
              </div>
              <div className="text-[9px] text-[var(--text-dim)]">{formatDate(record.date)}</div>
            </div>
          </div>
        ))}

        {stepStreak > 0 && (
          <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-secondary)] border-l-2 border-[var(--green)] hover:bg-[var(--bg-card-hover)] transition-colors">
            <span className="text-sm">🔥</span>
            <div>
              <div className="text-[9px] text-[var(--text-dim)] uppercase tracking-wider">Active Streak</div>
              <div className="text-sm font-bold text-[var(--green)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {stepStreak} days
              </div>
              <div className="text-[9px] text-[var(--text-dim)]">10,000+ steps</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
