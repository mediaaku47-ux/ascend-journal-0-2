/**
 * Date utility helper functions for accurate Day/Month/Year calculations in JournalStream
 */

export const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const MONTH_NAMES_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export const DAY_NAMES_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const DAY_NAMES_SHORT_ID = [
  'Min',
  'Sen',
  'Sel',
  'Rab',
  'Kam',
  'Jum',
  'Sab',
];

/**
 * Get real-time accurate date breakdown for today
 */
export const getRealToday = () => {
  const now = new Date();
  const day = now.getDate();
  const monthIndex = now.getMonth();
  const year = now.getFullYear();
  const dayOfWeek = now.getDay();
  
  return {
    date: now,
    day,
    monthIndex,
    year,
    monthName: `${MONTH_NAMES_ID[monthIndex]} ${year}`,
    dayName: DAY_NAMES_ID[dayOfWeek],
    dayShort: DAY_NAMES_SHORT_ID[dayOfWeek],
    totalDaysInMonth: getDaysInMonth(year, monthIndex),
    fullFormattedDate: `${DAY_NAMES_ID[dayOfWeek]}, ${day} ${MONTH_NAMES_ID[monthIndex]} ${year}`,
  };
};

/**
 * Get the starting day offset (0 = Sunday, 1 = Monday, etc.) for the 1st day of a given month
 */
export const getFirstDayOfMonthOffset = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex, 1).getDay();
};

/**
 * Get total number of days in a specific month and year accurately (handles leap years).
 * monthIndex is 0-indexed (0 = Januari, 1 = Februari, etc.)
 */
export const getDaysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

/**
 * Get the day of week information for a specific date
 */
export const getDayInfo = (year: number, monthIndex: number, day: number) => {
  const date = new Date(year, monthIndex, day);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday...
  return {
    dayOfWeek,
    name: DAY_NAMES_ID[dayOfWeek],
    short: DAY_NAMES_SHORT_ID[dayOfWeek],
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
  };
};

/**
 * Format a full Indonesian date string e.g. "Rabu, 2 Maret 2026"
 */
export const formatFullIndonesianDate = (date: Date = new Date()): string => {
  const dayName = DAY_NAMES_ID[date.getDay()];
  const dayNum = date.getDate();
  const monthName = MONTH_NAMES_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
};

/**
 * Format date for input [type="date"] (YYYY-MM-DD)
 */
export const toISODateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert YYYY-MM-DD string to readable Indonesian date (e.g., "2 Mar 2026")
 */
export const formatReadableDate = (isoString?: string): string => {
  if (!isoString) return 'Hari ini';
  if (isoString === 'Hari ini' || isoString === 'Kemarin') return isoString;

  try {
    const parts = isoString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(monthIdx) && !isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTH_NAMES_SHORT_ID[monthIdx]} ${year}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return isoString;
};

/**
 * Generate an array of available years for the year picker (e.g., 2020 - 2035)
 */
export const getYearOptions = (currentYear: number = new Date().getFullYear()): number[] => {
  const years: number[] = [];
  const startYear = Math.min(currentYear - 3, 2023);
  const endYear = Math.max(currentYear + 5, 2030);
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }
  return years;
};

/**
 * Format transaction date to always show exact date and month (e.g. "4 Sep", "3 Sep", "28 Agu")
 * accurately indicating if it occurred today or yesterday with precise timestamp.
 */
export const formatTransactionDisplayDate = (tx: { date?: string; timestamp?: number }): string => {
  const now = new Date();
  
  if (tx.timestamp) {
    const d = new Date(tx.timestamp);
    const day = d.getDate();
    const month = MONTH_NAMES_SHORT_ID[d.getMonth()];
    const year = d.getFullYear();
    const time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const isToday = 
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
      
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = 
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    const dateMonth = year === now.getFullYear() ? `${day} ${month}` : `${day} ${month} ${year}`;
    
    if (isToday) {
      return `${dateMonth} (Hari ini • ${time})`;
    }
    if (isYesterday) {
      return `${dateMonth} (Kemarin • ${time})`;
    }
    return `${dateMonth} • ${time}`;
  }

  // If tx.date is an ISO string YYYY-MM-DD
  if (tx.date && /^\d{4}-\d{2}-\d{2}$/.test(tx.date)) {
    const parts = tx.date.split('-');
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
      const month = MONTH_NAMES_SHORT_ID[monthIdx];
      return year === now.getFullYear() ? `${day} ${month}` : `${day} ${month} ${year}`;
    }
  }

  // If tx.date is already formatted with day and month (e.g. "3 Sep" or "4 Sep 2026")
  if (tx.date && tx.date !== 'Hari ini' && tx.date !== 'Kemarin') {
    return tx.date;
  }

  // If tx.date was stored as 'Hari ini', convert to current date and month
  if (tx.date === 'Hari ini') {
    return `${now.getDate()} ${MONTH_NAMES_SHORT_ID[now.getMonth()]} (Hari ini)`;
  }

  // If tx.date was stored as 'Kemarin', convert to yesterday's date and month
  if (tx.date === 'Kemarin') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return `${yesterday.getDate()} ${MONTH_NAMES_SHORT_ID[yesterday.getMonth()]} (Kemarin)`;
  }

  return tx.date || `${now.getDate()} ${MONTH_NAMES_SHORT_ID[now.getMonth()]}`;
};

/**
 * Check whether a transaction truly occurred today based on timestamp or accurate date
 */
export const isTransactionToday = (tx: { date?: string; timestamp?: number }): boolean => {
  const now = new Date();
  const todayIso = toISODateString(now);

  if (tx.timestamp) {
    const txDate = new Date(tx.timestamp);
    return (
      txDate.getFullYear() === now.getFullYear() &&
      txDate.getMonth() === now.getMonth() &&
      txDate.getDate() === now.getDate()
    );
  }

  if (!tx.date) return false;
  if (tx.date === 'Hari ini') return true;
  if (tx.date === todayIso) return true;

  const todayFormatted = `${now.getDate()} ${MONTH_NAMES_SHORT_ID[now.getMonth()]}`;
  return tx.date.startsWith(todayFormatted);
};
