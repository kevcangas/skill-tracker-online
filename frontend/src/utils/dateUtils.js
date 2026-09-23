export const getTodayString = () => {
  const d = new Date();
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getCurrentYear = () => new Date().getFullYear();
export const getCurrentMonth = () => new Date().getMonth() + 1;

export const isSessionInTimeFilter = (
  loggedAtStr,
  timeFilter,
  customFilterMode,
  selectedDayDate,
  selectedYear,
  selectedMonth,
  selectedWeekDate
) => {
  if (!loggedAtStr) return false;
  if (timeFilter === 'all') return true;

  const dateObj = new Date(loggedAtStr);
  if (isNaN(dateObj.getTime())) return true;

  const now = new Date();

  if (timeFilter === 'week') {
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return dateObj >= startOfWeek && dateObj <= endOfWeek;
  }

  if (timeFilter === 'month') {
    return dateObj.getFullYear() === now.getFullYear() && dateObj.getMonth() === now.getMonth();
  }

  if (timeFilter === 'year') {
    return dateObj.getFullYear() === now.getFullYear();
  }

  if (timeFilter === 'custom') {
    const pad = (n) => (n < 10 ? '0' + n : n);
    const yyyymmdd = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;

    if (customFilterMode === 'day') {
      return yyyymmdd === selectedDayDate;
    }
    if (customFilterMode === 'year') {
      return dateObj.getFullYear() === parseInt(selectedYear, 10);
    }
    if (customFilterMode === 'month') {
      return dateObj.getFullYear() === parseInt(selectedYear, 10) && (dateObj.getMonth() + 1) === parseInt(selectedMonth, 10);
    }
    if (customFilterMode === 'week') {
      if (!selectedWeekDate) return true;
      const refDate = new Date(selectedWeekDate + 'T00:00:00');
      if (isNaN(refDate.getTime())) return true;
      const startOfWeek = new Date(refDate);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return dateObj >= startOfWeek && dateObj <= endOfWeek;
    }
  }

  return true;
};

export const getYesterdayString = (refDate = new Date()) => {
  const d = new Date(refDate);
  d.setDate(d.getDate() - 1);
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatDateLocal = (dateObj) => {
  if (!dateObj) return '';
  const d = typeof dateObj === 'string' ? new Date(dateObj) : dateObj;
  if (isNaN(d.getTime())) return '';
  const pad = (n) => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Normalized streak calculation adhering to TSK-03:
 * 1. Filter out soft deleted logs (is_deleted === true)
 * 2. Map timestamps to local calendar date (YYYY-MM-DD)
 * 3. Deduplicate dates using a Set
 * 4. Grace period for today/yesterday
 * 5. Computes currentStreak and longestStreak
 */
export const calculateStreak = (logs = [], referenceDate = new Date()) => {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const validLogs = logs.filter(l => !l.is_deleted);
  if (validLogs.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dateSet = new Set();
  validLogs.forEach(l => {
    const rawDate = l.logged_at || l.date;
    if (rawDate) {
      const dateStr = formatDateLocal(rawDate);
      if (dateStr) dateSet.add(dateStr);
    }
  });

  if (dateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const pad = (n) => (n < 10 ? '0' + n : n);
  const todayStr = `${referenceDate.getFullYear()}-${pad(referenceDate.getMonth() + 1)}-${pad(referenceDate.getDate())}`;
  const yesterdayStr = getYesterdayString(referenceDate);

  let currentStreak = 0;
  if (dateSet.has(todayStr)) {
    currentStreak = 1;
    let checkDate = new Date(referenceDate);
    checkDate.setDate(checkDate.getDate() - 1);
    while (dateSet.has(`${checkDate.getFullYear()}-${pad(checkDate.getMonth() + 1)}-${pad(checkDate.getDate())}`)) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else if (dateSet.has(yesterdayStr)) {
    currentStreak = 1;
    let checkDate = new Date(referenceDate);
    checkDate.setDate(checkDate.getDate() - 2);
    while (dateSet.has(`${checkDate.getFullYear()}-${pad(checkDate.getMonth() + 1)}-${pad(checkDate.getDate())}`)) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  } else {
    currentStreak = 0;
  }

  const sortedDates = Array.from(dateSet).sort();
  let longestStreak = 0;
  if (sortedDates.length > 0) {
    let currRun = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currRun += 1;
        if (currRun > longestStreak) longestStreak = currRun;
      } else if (diffDays > 1) {
        currRun = 1;
      }
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);
  return { currentStreak, longestStreak };
};

