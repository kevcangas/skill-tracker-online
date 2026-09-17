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
