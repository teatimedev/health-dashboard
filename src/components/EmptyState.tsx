'use client';

import { generateMockData } from '@/lib/mock-data';
import { saveMetrics } from '@/lib/store';

interface EmptyStateProps {
  onUpload: () => void;
}

export default function EmptyState({ onUpload }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-4xl mb-4">📡</div>
      <h2
        className="text-lg font-bold uppercase tracking-[4px] text-[var(--amber)] mb-2"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        No Signal Detected
      </h2>
      <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        RECON needs health data to operate. Upload an export from
        Health Auto Export (CSV or JSON), or configure the API endpoint
        for automatic data push.
      </p>
      <button
        onClick={onUpload}
        className="px-6 py-2.5 bg-[var(--amber)] text-[var(--bg-primary)] text-xs font-bold uppercase tracking-[2px] hover:opacity-90 transition-opacity"
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        ↑ Upload Health Data
      </button>
      <div className="mt-8 p-4 bg-[var(--bg-card)] border border-[var(--border)] max-w-sm w-full text-left">
        <div
          className="text-[10px] text-[var(--amber)] uppercase tracking-[2px] mb-2 font-semibold"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        >
          Quick Start
        </div>
        <ol className="text-[11px] text-[var(--text-dim)] space-y-1.5 list-decimal list-inside">
          <li>Open <span className="text-[var(--text-secondary)]">Health Auto Export</span> on your iPhone</li>
          <li>Export as <span className="text-[var(--text-secondary)]">CSV</span> or <span className="text-[var(--text-secondary)]">JSON</span></li>
          <li>Drag the file here or tap <span className="text-[var(--text-secondary)]">Upload</span></li>
        </ol>
        <div className="mt-3 pt-3 border-t border-[var(--border)]">
          <div className="text-[10px] text-[var(--text-dim)]">
            Or configure automatic export:
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] mt-1">
            POST /api/health-data
          </div>
          <div className="text-[10px] text-[var(--text-dim)]">
            Header: x-api-key: YOUR_API_KEY
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          const mock = generateMockData();
          saveMetrics(mock);
          window.location.reload();
        }}
        className="mt-4 text-[10px] text-[var(--text-dim)] hover:text-[var(--text-secondary)] underline transition-colors"
      >
        Load demo data instead
      </button>
    </div>
  );
}
