import React, { useMemo, useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { STATUS_COLORS } from '../../services/graphUtils';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

export default function TimelineGanttView() {
  const {
    filteredTasks,
    cpm,
    showCriticalPath,
    setShowCriticalPath,
    setSelectedTaskId,
    setBlastRadiusTaskId,
    setCurrentView,
  } = useProject();

  const [colWidth, setColWidth] = useState(48); // 40, 48, 60 px
  const timelineScrollRef = useRef(null);

  const projectDuration = cpm?.projectDuration || 25;
  const criticalPathSet = useMemo(() => new Set(cpm?.criticalPath || []), [cpm?.criticalPath]);

  // Project Calendar Baseline: Started 14 days ago so past tasks, current tasks, and future tasks align with real calendar
  const { baseDate, daysList, monthGroups, todayIndex } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Baseline starts 14 days before today
    const base = new Date(today);
    base.setDate(today.getDate() - 14);

    const totalDays = Math.max(35, projectDuration + 14 + 7); // Covers past completed tasks and future planned tasks
    const days = [];
    const months = [];
    let currentMonth = null;
    let monthDayCount = 0;
    let tIndex = -1;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);

      const isToday = d.toDateString() === today.toDateString();
      if (isToday) tIndex = i;

      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      days.push({
        index: i,
        date: d,
        dayNum: d.getDate(),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
        monthLabel,
        isWeekend,
        isToday,
      });

      if (!currentMonth || currentMonth.label !== monthLabel) {
        if (currentMonth) {
          currentMonth.span = monthDayCount;
        }
        currentMonth = { label: monthLabel, startIndex: i, span: 1 };
        months.push(currentMonth);
        monthDayCount = 1;
      } else {
        monthDayCount++;
      }
    }

    if (currentMonth) {
      currentMonth.span = monthDayCount;
    }

    return {
      baseDate: base,
      daysList: days,
      monthGroups: months,
      todayIndex: tIndex,
    };
  }, [projectDuration]);

  // Sort tasks by earliest start (ES) then duration
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const aES = a.cpm?.es ?? 0;
      const bES = b.cpm?.es ?? 0;
      return aES - bES;
    });
  }, [filteredTasks]);

  const handleInspect = (taskId) => {
    setSelectedTaskId(taskId);
  };

  const scrollToToday = () => {
    if (timelineScrollRef.current && todayIndex >= 0) {
      timelineScrollRef.current.scrollTo({
        left: Math.max(0, todayIndex * colWidth - 200),
        behavior: 'smooth',
      });
    }
  };

  const formatDateRange = (es, duration) => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() + es);

    const end = new Date(start);
    end.setDate(start.getDate() + duration);

    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header & Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-panel-border/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Calendar Timeline & Gantt Schedule
            <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {projectDuration} Days Critical Baseline
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real calendar dates with live milestone windows, float slack buffers, and zero-slack critical paths.
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scroll to Today */}
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 hover:border-zinc-500 transition-all"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Jump to Today</span>
          </button>

          {/* Zoom / Column Width Toggle */}
          <div className="flex items-center bg-panel-card rounded-xl p-1 border border-panel-border text-[11px] font-mono">
            <button
              onClick={() => setColWidth(40)}
              className={`px-2 py-0.5 rounded-lg transition-colors ${colWidth === 40 ? 'bg-panel-hover text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Compact
            </button>
            <button
              onClick={() => setColWidth(48)}
              className={`px-2 py-0.5 rounded-lg transition-colors ${colWidth === 48 ? 'bg-panel-hover text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Standard
            </button>
            <button
              onClick={() => setColWidth(64)}
              className={`px-2 py-0.5 rounded-lg transition-colors ${colWidth === 64 ? 'bg-panel-hover text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Spacious
            </button>
          </div>

          {/* Critical Path Toggle */}
          <button
            onClick={() => setShowCriticalPath(!showCriticalPath)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              showCriticalPath
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-glow-gold'
                : 'bg-panel-card hover:bg-panel-hover text-slate-300 border border-panel-border'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{showCriticalPath ? 'Critical Path' : 'Show Critical Path'}</span>
          </button>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div className="rounded-2xl border border-panel-border bg-panel-card glass-panel overflow-hidden">
        {/* Scrollable Container */}
        <div ref={timelineScrollRef} className="overflow-x-auto">
          {/* Header Row 1: Month Groups */}
          <div className="flex border-b border-panel-border bg-panel text-xs sticky top-0 z-20">
            {/* Task Title Header */}
            <div className="w-80 shrink-0 p-3 border-r border-panel-border font-semibold text-slate-400 text-[11px] uppercase tracking-wider bg-panel sticky left-0 z-30">
              Task & Owner
            </div>

            {/* Months */}
            <div className="flex">
              {monthGroups.map((m, idx) => (
                <div
                  key={idx}
                  style={{ width: `${m.span * colWidth}px` }}
                  className="py-1.5 px-3 border-r border-panel-border/80 text-xs font-bold text-slate-200 uppercase tracking-wider bg-panel/90 text-left truncate select-none"
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Header Row 2: Days of the Month (e.g. Thu 15, Fri 16) */}
          <div className="flex border-b border-panel-border bg-canvas-darker sticky top-8 z-10 text-xs select-none">
            {/* Left Column Spacer */}
            <div className="w-80 shrink-0 p-2.5 border-r border-panel-border bg-canvas-darker sticky left-0 z-20 text-[10px] text-slate-500 font-mono">
              Schedule Allocation
            </div>

            {/* Individual Day Columns */}
            <div className="flex divide-x divide-panel-border/40">
              {daysList.map((day) => (
                <div
                  key={day.index}
                  style={{ width: `${colWidth}px` }}
                  className={`shrink-0 py-2 text-center font-mono flex flex-col items-center justify-center transition-colors ${
                    day.isToday
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border-b-2 border-cyan-400 shadow-glow-cyan/20'
                      : day.isWeekend
                      ? 'bg-slate-900/80 text-slate-500'
                      : 'text-slate-300 hover:bg-panel'
                  }`}
                  title={`${day.weekday}, ${day.monthShort} ${day.dayNum} ${day.isToday ? '(Today)' : ''}`}
                >
                  <span className="text-[10px] uppercase font-sans text-slate-400 block leading-tight">
                    {day.weekday}
                  </span>
                  <span className={`text-xs font-bold ${day.isToday ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {day.dayNum}
                  </span>
                  {day.isToday && (
                    <span className="text-[8px] bg-cyan-500/30 text-cyan-300 px-1 rounded-sm uppercase tracking-tighter mt-0.5">
                      Today
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-panel-border/40">
            {sortedTasks.map((task) => {
              const isCritical = criticalPathSet.has(task.taskId);
              const es = task.cpm?.es ?? 0;
              const slack = task.cpm?.slack ?? 0;
              const duration = task.estimatedDays || 1;

              const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.Ready;

              // Positioning calculation using colWidth
              const leftPx = es * colWidth;
              const widthPx = duration * colWidth;
              const slackPx = slack * colWidth;

              const rangeLabel = formatDateRange(es, duration);

              return (
                <div
                  key={task.taskId}
                  onClick={() => handleInspect(task.taskId)}
                  className={`flex items-center hover:bg-panel-hover/60 transition-colors group cursor-pointer ${
                    showCriticalPath && isCritical ? 'bg-amber-500/5' : ''
                  }`}
                >
                  {/* Left Task Label Cell (Sticky) */}
                  <div className="w-80 shrink-0 p-3.5 border-r border-panel-border flex items-center justify-between gap-2 overflow-hidden bg-panel-card group-hover:bg-panel-hover/90 sticky left-0 z-10 shadow-md">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-xs font-bold text-cyan-400 group-hover:underline">
                          {task.taskId}
                        </span>
                        {isCritical && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            CPM
                          </span>
                        )}
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                          {task.status}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-white truncate" title={task.title}>
                        {task.title}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {task.owner?.name} • {duration}d ({rangeLabel})
                      </div>
                    </div>
                  </div>

                  {/* Right Gantt Bar Cell with Calendar Columns */}
                  <div className="flex-1 relative h-14 flex items-center">
                    {/* Background Grid Lines & Weekends */}
                    <div className="absolute inset-0 flex divide-x divide-panel-border/20 pointer-events-none">
                      {daysList.map((day) => (
                        <div
                          key={day.index}
                          style={{ width: `${colWidth}px` }}
                          className={`shrink-0 h-full ${
                            day.isToday
                              ? 'bg-cyan-500/5 border-r border-cyan-500/40'
                              : day.isWeekend
                              ? 'bg-slate-900/40'
                              : ''
                          }`}
                        />
                      ))}
                    </div>

                    {/* Today Vertical Line Indicator */}
                    {todayIndex >= 0 && (
                      <div
                        style={{ left: `${todayIndex * colWidth + colWidth / 2}px` }}
                        className="absolute top-0 bottom-0 w-[2px] bg-cyan-400/70 z-20 pointer-events-none shadow-glow-cyan"
                        title="Today"
                      />
                    )}

                    {/* Active Task Bar */}
                    <div
                      style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                      className={`absolute h-8 rounded-xl flex items-center px-3 shadow-md transition-all z-10 select-none overflow-hidden ${
                        showCriticalPath && isCritical
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold border border-amber-300 shadow-glow-gold'
                          : task.status === 'Completed'
                          ? 'bg-emerald-600/90 text-white border border-emerald-400/50'
                          : task.status === 'Blocked'
                          ? 'bg-rose-600/90 text-white border border-rose-400/50'
                          : 'bg-blue-600/90 text-white border border-blue-400/50'
                      }`}
                      title={`${task.taskId}: ${task.title}\nDates: ${rangeLabel} (${duration} days)\nStatus: ${task.status}\nOwner: ${task.owner?.name}`}
                    >
                      <span className="text-[11px] font-semibold truncate">
                        {task.taskId} ({duration}d)
                      </span>
                    </div>

                    {/* Slack Buffer Bar (Total Float) */}
                    {slack > 0 && (
                      <div
                        style={{ left: `${leftPx + widthPx}px`, width: `${slackPx}px` }}
                        className="absolute h-6 rounded-r-lg bg-slate-800/80 border border-dashed border-slate-600 flex items-center justify-center text-[10px] font-mono text-slate-400 z-0"
                        title={`Slack / Float: ${slack} days of buffer before delivery is impacted`}
                      >
                        +{slack}d
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
