'use client';

import { useState, useCallback, useRef } from 'react';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  onClose: () => void;
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const dropped = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.csv') || f.name.endsWith('.json')
    );
    if (dropped.length) setFiles(prev => [...prev, ...dropped]);
  }, []);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const handleSubmit = () => {
    if (files.length > 0) {
      onUpload(files);
      setFiles([]);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] mx-4 mt-4 p-5 animate-card-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-[2px] text-[var(--amber)]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          ▸ Data Import
        </h3>
        <button onClick={onClose} className="text-[var(--text-dim)] hover:text-[var(--text-secondary)] text-xs">✕</button>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-[var(--amber)] bg-[var(--amber-dim)]'
            : 'border-[var(--border)] hover:border-[var(--border-bright)]'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.json"
          multiple
          className="hidden"
          onChange={handleSelect}
        />
        <div className="text-2xl mb-2">📁</div>
        <div className="text-xs text-[var(--text-secondary)] mb-1">
          Drop CSV or JSON files here
        </div>
        <div className="text-[10px] text-[var(--text-dim)]">
          Health Auto Export format · Click to browse
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] text-[var(--text-dim)] mb-2 uppercase tracking-wider">
            {files.length} file{files.length > 1 ? 's' : ''} selected:
          </div>
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between py-1 text-xs text-[var(--text-secondary)]">
              <span>{f.name}</span>
              <span className="text-[var(--text-dim)]">{(f.size / 1024).toFixed(1)} KB</span>
            </div>
          ))}
          <button
            onClick={handleSubmit}
            className="mt-3 px-4 py-2 bg-[var(--amber)] text-[var(--bg-primary)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity w-full"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            Import Data
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-[var(--bg-secondary)] border border-[var(--border)]">
        <div className="text-[10px] text-[var(--amber)] uppercase tracking-wider mb-1 font-semibold" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
          API Endpoint
        </div>
        <div className="text-[10px] text-[var(--text-dim)]">
          POST <span className="text-[var(--text-secondary)]">/api/health-data</span>
        </div>
        <div className="text-[10px] text-[var(--text-dim)] mt-1">
          Header: <span className="text-[var(--text-secondary)]">x-api-key: YOUR_API_KEY</span>
        </div>
        <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
          Configure in Health Auto Export → REST API
        </div>
      </div>
    </div>
  );
}
