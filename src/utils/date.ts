import { format, parseISO, isBefore, isAfter, addDays, addWeeks, addMonths, startOfDay, endOfDay, isSameDay } from 'date-fns';

export const dateUtils = {
  format: (date: Date | string, formatStr: string = 'PPP'): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  },

  formatTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
  },

  formatDateTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'PPp');
  },

  isBefore: (date: Date | string, compareDate: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const compareObj = typeof compareDate === 'string' ? parseISO(compareDate) : compareDate;
    return isBefore(dateObj, compareObj);
  },

  isAfter: (date: Date | string, compareDate: Date | string): boolean => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const compareObj = typeof compareDate === 'string' ? parseISO(compareDate) : compareDate;
    return isAfter(dateObj, compareObj);
  },

  isSameDay: (date1: Date | string, date2: Date | string): boolean => {
    const dateObj1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const dateObj2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isSameDay(dateObj1, dateObj2);
  },

  addDays: (date: Date | string, amount: number): Date => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addDays(dateObj, amount);
  },

  addWeeks: (date: Date | string, amount: number): Date => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addWeeks(dateObj, amount);
  },

  addMonths: (date: Date | string, amount: number): Date => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addMonths(dateObj, amount);
  },

  startOfDay: (date: Date | string): Date => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return startOfDay(dateObj);
  },

  endOfDay: (date: Date | string): Date => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return endOfDay(dateObj);
  },

  getToday: (): Date => {
    return startOfDay(new Date());
  },

  getTomorrow: (): Date => {
    return addDays(startOfDay(new Date()), 1);
  },
};

