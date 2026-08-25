'use client';

import React from 'react';
import Top10ResultsBoard from './Top10ResultsBoard';
import { Top10ResultsData } from '@/lib/optimizer';

interface ResultsDashboardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export default function ResultsDashboard({ data }: ResultsDashboardProps) {
  // If data has topAccounts, render modern Top10ResultsBoard
  if (data && data.topAccounts) {
    return <Top10ResultsBoard data={data as Top10ResultsData} />;
  }

  return (
    <div className="p-8 text-center bg-steam-card border border-steam-border rounded-3xl">
      <p className="text-xs text-steam-textMuted">Trwa generowanie wyników...</p>
    </div>
  );
}
