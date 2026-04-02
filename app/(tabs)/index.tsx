import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

import { ThemedView } from '@/components/themed-view';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { CalendarDay } from '@/components/calendar/calendar-day';
import { PaymentList } from '@/components/calendar/payment-list';
import { useAuth } from '@/contexts/auth-context';
import { getDailyTotal, getMonthlyTotal, getPaymentsForDate, getSelectedDateForMonth } from '@/utils/calendar';
import { DUMMY_PAYMENTS, DUMMY_USERS } from '@/constants/dummy-data';

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarScreen() {
  const { user, group, loading } = useAuth();
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today.substring(0, 7));

  const payments = DUMMY_PAYMENTS; // Phase 4에서 Firestore 데이터로 교체

  const monthlyTotal = useMemo(
    () => getMonthlyTotal(payments, currentMonth),
    [payments, currentMonth]
  );

  const selectedPayments = useMemo(
    () => getPaymentsForDate(payments, selectedDate),
    [payments, selectedDate]
  );

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleMonthChange = useCallback((month: DateData) => {
    const yearMonth = `${month.year}-${String(month.month).padStart(2, '0')}`;
    setCurrentMonth(yearMonth);
    setSelectedDate(getSelectedDateForMonth(yearMonth, today));
  }, [today]);

  if (loading || !user || !group) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const year = parseInt(currentMonth.split('-')[0], 10);
  const month = parseInt(currentMonth.split('-')[1], 10);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.calendarContainer}>
        <CalendarHeader year={year} month={month} monthlyTotal={monthlyTotal} />
        <Calendar
          current={`${currentMonth}-01`}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          hideExtraDays
          renderHeader={() => null}
          dayComponent={({ date, state }) => (
            <CalendarDay
              date={date?.dateString ?? ''}
              state={state}
              isSelected={date?.dateString === selectedDate}
              dailyTotal={getDailyTotal(payments, date?.dateString ?? '')}
              onPress={(d) => handleDayPress({ dateString: d, day: 0, month: 0, year: 0, timestamp: 0 })}
            />
          )}
          theme={{
            calendarBackground: 'transparent',
          }}
        />
      </View>
      <PaymentList
        selectedDate={selectedDate}
        payments={selectedPayments}
        users={DUMMY_USERS}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  calendarContainer: {
    // 달력 고정, 하단 리스트만 스크롤
  },
});
