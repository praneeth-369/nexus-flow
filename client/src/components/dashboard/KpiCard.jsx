import React from 'react';

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'emerald', highlight = false }) {
  const colorMap = {
    emerald: {
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      glow: 'shadow-glow-accent',
    },
    rose: {
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      glow: 'shadow-glow-rose',
    },
    gold: {
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      glow: 'shadow-glow-amber',
    },
    amber: {
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      glow: 'shadow-glow-amber',
    },
    zinc: {
      border: 'border-zinc-700',
      text: 'text-zinc-200',
      bg: 'bg-zinc-800',
      glow: '',
    },
    cyan: {
      border: 'border-zinc-700',
      text: 'text-emerald-400',
      bg: 'bg-zinc-800',
      glow: '',
    },
    blue: {
      border: 'border-zinc-700',
      text: 'text-zinc-300',
      bg: 'bg-zinc-800',
      glow: '',
    },
  };

  const scheme = colorMap[color] || colorMap.zinc;

  return (
    <div
      className={`relative p-5 rounded-2xl bg-panel-card border ${scheme.border} glass-panel transition-all hover:border-zinc-500 group ${
        highlight ? scheme.glow : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${scheme.bg} ${scheme.text}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">
          {value}
        </span>
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-zinc-400 flex items-center gap-1.5">
          {subtitle}
        </p>
      )}
    </div>
  );
}
