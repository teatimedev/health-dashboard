'use client';

import { ViewTab } from '@/lib/types';

interface NavigationProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

const TABS: { id: ViewTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'weight', label: 'Weight' },
  { id: 'activity', label: 'Activity' },
  { id: 'heart', label: 'Heart' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'sitrep', label: 'SITREP' },
];

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="flex gap-0 px-5 bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-x-auto">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[2px] whitespace-nowrap
            border-b-2 transition-all
            ${activeTab === tab.id
              ? 'text-[var(--amber)] border-[var(--amber)]'
              : 'text-[var(--text-dim)] border-transparent hover:text-[var(--text-secondary)]'
            }
          `}
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          <span className={`mr-1.5 transition-opacity ${activeTab === tab.id ? 'opacity-100 text-[var(--amber)]' : 'opacity-0'}`}>▸</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
