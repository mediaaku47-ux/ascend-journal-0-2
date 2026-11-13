import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { Task, Habit, UserProfile } from '../types';
import { MONTH_NAMES_SHORT_ID, getDaysInMonth } from '../utils/dateUtils';
import { getUserLevelProgress, UserLevelProgress } from '../utils/levelUtils';

interface TrackingStatsCardProps {
  tasks: Task[];
  habits: Habit[];
  userProfile: UserProfile;
  levelProgress?: UserLevelProgress;
  onOpenNewEntry?: () => void;
  onExportPDF?: () => void;
  onOpenRoadmap?: () => void;
  theme?: 'dark' | 'light';
}

type TimeRange = '7d' | '14d' | 'month' | 'all';

export const TrackingStatsCard: React.FC<TrackingStatsCardProps> = ({
  tasks,
  habits,
  userProfile,
  levelProgress: passedLevelProgress,
  onExportPDF,
  onOpenRoadmap,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const monthIdx = userProfile.monthIndex ?? 2; // Default Maret (2)
  const currentYear = userProfile.year || 2026;
  const totalDays = userProfile.totalDaysInMonth || getDaysInMonth(currentYear, monthIdx);
  const monthShort = MONTH_NAMES_SHORT_ID[monthIdx] || 'Bln';

  const todayObj = new Date();
  const currentRealDay = userProfile.selectedDay || todayObj.getDate();

  const internalLevelProgress = useMemo(() => {
    return getUserLevelProgress(tasks, habits, userProfile.streakDays, currentRealDay);
  }, [tasks, habits, userProfile.streakDays, currentRealDay]);

  const levelProgress = passedLevelProgress || internalLevelProgress;

  // Compute daily stats across the active month based STRICTLY on real task checklist data
  const chartData = useMemo(() => {
    let daysCount = totalDays;
    let startDay = 1;

    if (timeRange === '7d') {
      daysCount = 7;
      startDay = Math.max(1, currentRealDay - 6);
    } else if (timeRange === '14d') {
      daysCount = 14;
      startDay = Math.max(1, currentRealDay - 13);
    }

    const dataPoints: { day: number; label: string; currentScore: number; prevScore: number; doneCount: number; totalTasks: number }[] = [];

    for (let i = 0; i < daysCount; i++) {
      const dayNum = startDay + i;
      if (dayNum > totalDays) break;

      let done = 0;
      let missed = 0;

      tasks.forEach((task) => {
        const st = task.days[dayNum];
        if (st === 'done') done++;
        else if (st === 'missed') missed++;
      });

      // Skor murni akurat: proporsi agenda yang diceklis 'done' dari total agenda yang ada
      const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

      // Garis komparasi periode sebelumnya (7 hari sebelumnya secara nyata)
      const prevDayNum = dayNum - 7;
      let prevDone = 0;
      if (prevDayNum >= 1) {
        tasks.forEach((task) => {
          if (task.days[prevDayNum] === 'done') prevDone++;
        });
      }
      const prevScore = tasks.length > 0 && prevDayNum >= 1 ? Math.round((prevDone / tasks.length) * 100) : 0;

      dataPoints.push({
        day: dayNum,
        label: `${dayNum} ${monthShort}`,
        currentScore: pct,
        prevScore: prevScore,
        doneCount: done,
        totalTasks: tasks.length,
      });
    }

    return dataPoints;
  }, [tasks, timeRange, totalDays, monthShort, currentRealDay]);

  // Overall calculations for metrics based on user's actual checks
  const statsSummary = useMemo(() => {
    let totalDoneChecklist = 0;
    let totalAssignedSlots = 0;

    tasks.forEach((t) => {
      Object.entries(t.days).forEach(([_, val]) => {
        if (val === 'done') totalDoneChecklist++;
        if (val === 'done' || val === 'missed') totalAssignedSlots++;
      });
    });

    // Perhitungan spesifik hari ini (Today)
    const todayDoneTasks = tasks.filter((t) => t.days[currentRealDay] === 'done');
    const todayUncompletedTasks = tasks.filter((t) => t.days[currentRealDay] !== 'done');
    const todayDoneHabits = habits.filter((h) => h.completedToday);

    const totalTodayItems = tasks.length + habits.length;
    const totalTodayDone = todayDoneTasks.length + todayDoneHabits.length;
    // Skor konsistensi hari ini secara presisi:
    const todayScore = totalTodayItems > 0 
      ? Math.round((totalTodayDone / totalTodayItems) * 100) 
      : 0;

    // Hitung perbandingan dengan kemarin (yesterday)
    const yesterdayDay = currentRealDay > 1 ? currentRealDay - 1 : null;
    let yesterdayDoneCount = 0;
    if (yesterdayDay) {
      tasks.forEach((t) => {
        if (t.days[yesterdayDay] === 'done') yesterdayDoneCount++;
      });
    }
    const yesterdayScore = yesterdayDay && tasks.length > 0 
      ? Math.round((yesterdayDoneCount / tasks.length) * 100) 
      : 0;
    const scoreDiff = todayScore - yesterdayScore;

    // Agenda yang Sangat Konsisten: tugas dengan konsistensi >= 70% atau tuntas
    const highlyConsistentTasks = tasks.filter((t) => {
      const activeEntries = Object.values(t.days).filter((v) => v === 'done' || v === 'missed');
      if (activeEntries.length === 0) return false;
      const doneCount = activeEntries.filter((v) => v === 'done').length;
      return (doneCount / activeEntries.length) >= 0.7;
    });

    // Konsistensi keseluruhan bulan ini (murni dihitung dari ceklis nyata)
    const monthConsistencyRate = totalAssignedSlots > 0 
      ? Math.round((totalDoneChecklist / totalAssignedSlots) * 100) 
      : (tasks.length > 0 ? Math.round((todayDoneTasks.length / tasks.length) * 100) : 0);

    // Habits total progress
    let habitTotalDone = 0;
    let habitTotalTarget = 0;
    habits.forEach((h) => {
      habitTotalDone += h.completedDays;
      habitTotalTarget += h.totalDays;
    });
    const habitRate = habitTotalTarget > 0 ? Math.round((habitTotalDone / habitTotalTarget) * 100) : 0;

    return {
      todayScore,
      todayDoneTasksCount: todayDoneTasks.length,
      todayUncompletedTasks,
      todayDoneHabitsCount: todayDoneHabits.length,
      totalTodayItems,
      totalTodayDone,
      scoreDiff,
      monthConsistencyRate,
      highlyConsistentCount: highlyConsistentTasks.length,
      totalDoneChecklist,
      habitRate,
      habitTotalDone,
      streakDays: userProfile.streakDays || 0,
    };
  }, [tasks, habits, userProfile.streakDays, currentRealDay]);

  // Generate smooth SVG Bézier path from points
  const { pathCurrent, pathCurrentArea, pathPrev, ticks } = useMemo(() => {
    if (chartData.length < 2) {
      return { pathCurrent: '', pathCurrentArea: '', pathPrev: '', ticks: [] };
    }

    const width = 600;
    const height = 180;
    const paddingX = 20;
    const paddingY = 25;
    const innerW = width - paddingX * 2;
    const innerH = height - paddingY * 2;

    const maxVal = 100;
    const minVal = 0;

    const getX = (idx: number) => paddingX + (idx / (chartData.length - 1)) * innerW;
    const getY = (val: number) => height - paddingY - ((val - minVal) / (maxVal - minVal)) * innerH;

    // Catmull-Rom or cubic bezier builder
    const createCurvedPath = (accessor: (d: typeof chartData[0]) => number) => {
      const points = chartData.map((d, i) => ({ x: getX(i), y: getY(accessor(d)) }));
      
      let path = `M ${points[0].x},${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? i : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }
      return { path, points };
    };

    const currentResult = createCurvedPath((d) => d.currentScore);
    const prevResult = createCurvedPath((d) => d.prevScore);

    const firstPoint = currentResult.points[0];
    const lastPoint = currentResult.points[currentResult.points.length - 1];
    const areaPath = `${currentResult.path} L ${lastPoint.x},${height - paddingY + 10} L ${firstPoint.x},${height - paddingY + 10} Z`;

    // Pick 4 to 5 nice date ticks for X-axis labels
    const step = Math.max(1, Math.floor(chartData.length / 4));
    const labelTicks: { label: string; x: number }[] = [];
    for (let i = 0; i < chartData.length; i += step) {
      labelTicks.push({
        label: chartData[i].label,
        x: getX(i),
      });
    }
    if (labelTicks[labelTicks.length - 1].x !== getX(chartData.length - 1)) {
      labelTicks.push({
        label: chartData[chartData.length - 1].label,
        x: getX(chartData.length - 1),
      });
    }

    return {
      pathCurrent: currentResult.path,
      pathCurrentArea: areaPath,
      pathPrev: prevResult.path,
      ticks: labelTicks,
    };
  }, [chartData]);

  const activeHoverData = hoveredIndex !== null && chartData[hoveredIndex] ? chartData[hoveredIndex] : null;

  return (
    <div
      id="card-tracking-statistics"
      className="w-full relative transition-all duration-300 pt-1 pb-4"
    >
      {/* Top Bar: Title & Time Range Switcher */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b relative z-10 ${
        isLight ? 'border-slate-200' : 'border-[#263449]'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner ${
            isLight
              ? 'bg-teal-50 text-teal-700 border-teal-200'
              : 'bg-[#111827] border border-[#263449] text-cyan-400'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Statistik & Pelacakan Konsistensi
              </h3>
            </div>
            <p className={`text-xs flex items-center gap-1.5 mt-0.5 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-teal-600' : 'text-cyan-400'}`} />
              <span>{userProfile.monthName || 'Bulan Ini'} (Hari ke-{currentRealDay})</span>
            </p>
          </div>
        </div>

        {/* Time Range Filter Buttons & PDF export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center p-1 rounded-2xl border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
          }`}>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === '7d'
                  ? isLight ? 'bg-[#003B2F] text-white shadow-xs' : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setTimeRange('14d')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === '14d'
                  ? isLight ? 'bg-[#003B2F] text-white shadow-xs' : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              14 Hari
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                timeRange === 'month'
                  ? isLight ? 'bg-[#003B2F] text-white shadow-xs' : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'text-slate-700 hover:text-slate-950 hover:bg-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Bulan Ini
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric + Sparkline Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-6 relative z-10">
        {/* Left Column: Real-time consistency score */}
        <div className="lg:col-span-4 space-y-3">
          <div className={`text-xs font-bold tracking-wide uppercase ${isLight ? 'text-slate-700' : 'text-white/50'}`}>
            Tingkat Produktivitas Hari Ini
          </div>

          <div className="flex items-baseline gap-3">
            <span className={`text-4xl sm:text-5xl font-black tracking-tight font-mono ${isLight ? 'text-slate-950' : 'text-white'}`}>
              {statsSummary.todayScore}%
            </span>
            <span className={`text-xs font-bold font-mono ${isLight ? 'text-slate-700' : 'text-white/40'}`}>
              ({statsSummary.totalTodayDone}/{statsSummary.totalTodayItems} Selesai)
            </span>
          </div>

          {/* Dynamic Trend Badge based on real changes */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${
            statsSummary.scoreDiff > 0
              ? isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-950' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : statsSummary.scoreDiff < 0
              ? isLight ? 'bg-rose-100 border-rose-300 text-rose-950' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              : isLight ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/10 border-white/15 text-white/60'
          }`}>
            {statsSummary.scoreDiff > 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            ) : statsSummary.scoreDiff < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <Activity className="w-3 h-3 text-teal-600" />
            )}
            <span>
              {statsSummary.scoreDiff > 0 ? `+${statsSummary.scoreDiff}%` : `${statsSummary.scoreDiff}%`}
            </span>
            <span className={`font-semibold ml-0.5 ${isLight ? 'text-slate-700' : 'text-white/50'}`}>vs. kemarin</span>
          </div>
        </div>

        {/* Right Column: Dynamic SVG Smooth Area Line Chart */}
        <div className={`lg:col-span-8 rounded-2xl border p-3.5 relative overflow-hidden ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'
        }`}>
          {/* Chart Header Info */}
          <div className={`flex justify-between items-center px-2 mb-1 text-[11px] font-bold ${
            isLight ? 'text-slate-700' : 'text-white/50'
          }`}>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isLight ? 'bg-teal-600 shadow-xs' : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'}`}></span>
                <span className={isLight ? 'text-slate-900 font-bold' : 'text-white/80 font-medium'}>Tren Aktivitas</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-0.5 rounded-full border-t border-dashed ${isLight ? 'border-slate-400' : 'border-white/60'}`}></span>
                <span className={isLight ? 'text-slate-600 font-semibold' : 'text-white/40'}>7 Hari Sebelumnya</span>
              </span>
            </div>

            {activeHoverData && (
              <span className={`font-mono font-bold px-2 py-0.5 rounded-md border ${
                isLight 
                  ? 'text-teal-900 bg-teal-100 border-teal-300' 
                  : 'text-sky-300 bg-sky-500/20 border-sky-500/30'
              }`}>
                {activeHoverData.label}: {activeHoverData.currentScore}% ({activeHoverData.doneCount}/{activeHoverData.totalTasks} selesai)
              </span>
            )}
          </div>

          {/* SVG Canvas Area */}
          <div className="relative w-full h-[160px]">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 600 180"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Glow Linear Gradient for Area fill */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isLight ? "#0d9488" : "#38bdf8"} stopOpacity={isLight ? "0.25" : "0.4"} />
                  <stop offset="50%" stopColor={isLight ? "#14b8a6" : "#6366f1"} stopOpacity={isLight ? "0.1" : "0.15"} />
                  <stop offset="100%" stopColor={isLight ? "#0f766e" : "#0284c7"} stopOpacity="0.0" />
                </linearGradient>

                {/* Glowing Stroke Filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={isLight ? "#0d9488" : "#38bdf8"} floodOpacity={isLight ? "0.3" : "0.6"} />
                </filter>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="20" y1="35" x2="580" y2="35" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} strokeDasharray="3 3" />
              <line x1="20" y1="90" x2="580" y2="90" stroke={isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)"} strokeDasharray="3 3" />
              <line x1="20" y1="145" x2="580" y2="145" stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"} />

              {/* Previous period line (dashed / faint) */}
              {pathPrev && (
                <path
                  d={pathPrev}
                  fill="none"
                  stroke={isLight ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.25)"}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}

              {/* Area Gradient under main line */}
              {pathCurrentArea && (
                <path
                  d={pathCurrentArea}
                  fill="url(#areaGradient)"
                />
              )}

              {/* Active Period Smooth Curved Line */}
              {pathCurrent && (
                <path
                  d={pathCurrent}
                  fill="none"
                  stroke={isLight ? "#0d9488" : "#38bdf8"}
                  strokeWidth="3.5"
                  filter="url(#glow)"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Hover Point Markers */}
              {chartData.map((pt, idx) => {
                const width = 600;
                const height = 180;
                const paddingX = 20;
                const paddingY = 25;
                const innerW = width - paddingX * 2;
                const innerH = height - paddingY * 2;
                const cx = paddingX + (idx / (chartData.length - 1)) * innerW;
                const cy = height - paddingY - (pt.currentScore / 100) * innerH;

                const isHovered = hoveredIndex === idx;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="cursor-pointer"
                  >
                    <circle cx={cx} cy={cy} r="14" fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? '6' : '3.5'}
                      fill={isHovered ? (isLight ? '#0f766e' : '#ffffff') : (isLight ? '#0d9488' : '#38bdf8')}
                      stroke={isLight ? '#ffffff' : '#18181b'}
                      strokeWidth="2"
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}
            </svg>

            {/* X-axis Date Labels */}
            <div className={`flex justify-between items-center text-[10px] font-mono mt-1 px-3 font-bold ${
              isLight ? 'text-slate-700' : 'text-white/40'
            }`}>
              {ticks.map((t, idx) => (
                <span key={idx}>{t.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Cards with Requested Terminology & Real Dynamic Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
        {/* Card 1: AGENDA PERLU DIPERBAIKI */}
        <div className={`rounded-2xl p-4 transition-all group flex flex-col justify-between relative overflow-hidden shadow-xs border ${
          isLight
            ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 shadow-xs'
            : 'bg-[#111827] hover:bg-[#152033] border border-[#263449]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                  statsSummary.todayUncompletedTasks.length > 0 
                    ? isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {statsSummary.todayUncompletedTasks.length > 0 ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-xl font-black font-mono tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {statsSummary.todayUncompletedTasks.length}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                statsSummary.todayUncompletedTasks.length > 0
                  ? isLight ? 'text-amber-950 bg-amber-100 border-amber-300 font-bold' : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                  : isLight ? 'text-emerald-950 bg-emerald-100 border-emerald-300 font-bold' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
              }`}>
                {statsSummary.todayUncompletedTasks.length > 0 ? 'Dalam Proses' : 'Semua Tuntas ✨'}
              </span>
            </div>
            <p className={`text-xs font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>Agenda Perlu Diperhatikan</p>
            <p className={`text-[11px] mt-1 line-clamp-1 font-semibold ${isLight ? 'text-slate-700' : 'text-white/50'}`}>
              {statsSummary.todayUncompletedTasks.length > 0
                ? `${statsSummary.todayUncompletedTasks[0].title}${statsSummary.todayUncompletedTasks.length > 1 ? ` (+${statsSummary.todayUncompletedTasks.length - 1} lainnya)` : ''}`
                : 'Tidak ada agenda tertinggal hari ini'}
            </p>
          </div>

          {/* Bottom Accent Bar */}
          <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                statsSummary.todayUncompletedTasks.length > 0 
                  ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                  : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
              }`}
              style={{ 
                width: `${tasks.length > 0 ? Math.round((statsSummary.todayUncompletedTasks.length / tasks.length) * 100) : 0}%` 
              }} 
            />
          </div>
        </div>

        {/* Card 2: AGENDA SANGAT KONSISTEN */}
        <div className={`rounded-2xl p-4 transition-all group flex flex-col justify-between relative overflow-hidden shadow-xs border ${
          isLight
            ? 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 shadow-xs'
            : 'bg-[#111827] hover:bg-[#152033] border border-[#263449]'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                  isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className={`text-xl font-black font-mono tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {statsSummary.monthConsistencyRate}%
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                isLight ? 'text-emerald-950 bg-emerald-100 border-emerald-300 font-bold' : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {statsSummary.highlyConsistentCount} Agenda Stabil
              </span>
            </div>
            <p className={`text-xs font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>Agenda Sangat Konsisten</p>
          </div>

          {/* Green Bottom Accent Bar */}
          <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              style={{ width: `${statsSummary.monthConsistencyRate}%` }}
            />
          </div>
        </div>

        {/* Card 3: LEVEL PERKEMBANGAN */}
        <div 
          onClick={onOpenRoadmap}
          className={`rounded-2xl p-4 transition-all group flex flex-col justify-between relative overflow-hidden shadow-xs cursor-pointer border ${
            isLight
              ? 'bg-slate-50 hover:bg-teal-50/50 border-slate-200 hover:border-teal-300 shadow-xs'
              : 'bg-[#111827] hover:bg-[#152033] border border-[#263449] hover:border-cyan-500/40'
          }`}
          title="Klik untuk melihat Roadmap Level Perkembangan (Level 1–5)"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                  isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                }`}>
                  <Trophy className={`w-4 h-4 ${isLight ? 'text-teal-700' : 'text-sky-400'}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-black font-mono tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    Lv.{levelProgress.currentLevel.level}
                  </span>
                  <span className={`text-xs font-black uppercase tracking-wide ${isLight ? 'text-teal-950' : 'text-sky-300'}`}>
                    {levelProgress.currentLevel.name}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                levelProgress.nextLevel
                  ? isLight ? 'text-teal-950 bg-teal-100 border-teal-300 font-bold' : 'text-sky-300 bg-sky-500/15 border-sky-500/30'
                  : isLight ? 'text-amber-950 bg-amber-100 border-amber-300 font-bold' : 'text-amber-300 bg-amber-500/15 border-amber-500/30'
              }`}>
                <Sparkles className={`w-2.5 h-2.5 ${isLight ? 'text-teal-700' : 'text-sky-400'}`} />
                <span>
                  {levelProgress.nextLevel 
                    ? `+${levelProgress.itemsRemaining} Tugas ke Lv.${levelProgress.nextLevel.level}` 
                    : 'Tingkat Puncak 🏆'}
                </span>
              </span>
            </div>
            <div className={`flex items-center justify-between text-xs font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
              <span>Level Perkembangan (1–5)</span>
              <span className={`font-mono font-black ${isLight ? 'text-teal-950' : 'text-sky-300'}`}>{levelProgress.overallProgressPercent}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`w-full h-1.5 rounded-full mt-3 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div 
              className={`h-full rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)] transition-all duration-500 ${
                isLight
                  ? 'bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-teal-400'
              }`}
              style={{ width: `${Math.max(10, levelProgress.overallProgressPercent)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
