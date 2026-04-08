import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { ThemedView } from '@/components/themed-view';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { CalendarDay } from '@/components/calendar/calendar-day';
import { PaymentList } from '@/components/calendar/payment-list';
import { AddPaymentModal } from '@/components/calendar/add-payment-modal';
import { useAuth } from '@/contexts/auth-context';
import { usePayments } from '@/hooks/use-payments';
import { getDailyTotal, getMonthlyTotal, getPaymentsForDate, getSelectedDateForMonth } from '@/utils/calendar';
import { deletePayment } from '@/services/payments';

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 그룹 멤버의 표시 정보 (색상은 userId 기반으로 고정 할당)
const MEMBER_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30'];

export default function CalendarScreen() {
  const { user, group, loading: authLoading } = useAuth();
  const today = getTodayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(today.substring(0, 7));
  const [showAddModal, setShowAddModal] = useState(false);

  const { payments, loading: paymentsLoading } = usePayments(group?.id, currentMonth);

  // 그룹 멤버 색상 매핑
  const memberUsers = useMemo(() => {
    if (!group) return {};
    const users: Record<string, { displayName: string; color: string }> = {};
    group.memberIds.forEach((id, index) => {
      users[id] = {
        displayName: id === user?.uid ? (user?.displayName ?? '나') : '멤버',
        color: MEMBER_COLORS[index % MEMBER_COLORS.length],
      };
    });
    return users;
  }, [group, user]);

  const monthlyTotal = useMemo(
    () => getMonthlyTotal(payments, currentMonth),
    [payments, currentMonth],
  );

  const selectedPayments = useMemo(
    () => getPaymentsForDate(payments, selectedDate),
    [payments, selectedDate],
  );

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  const handleMonthChange = useCallback((month: DateData) => {
    const yearMonth = `${month.year}-${String(month.month).padStart(2, '0')}`;
    setCurrentMonth(yearMonth);
    setSelectedDate(getSelectedDateForMonth(yearMonth, today));
  }, [today]);

  const handleDelete = useCallback(async (paymentId: string) => {
    if (!group) return;
    try {
      await deletePayment(group.id, paymentId);
    } catch {
      // onSnapshot이 자동으로 UI 업데이트
    }
  }, [group]);

  if (authLoading || !user || !group) {
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

      {paymentsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" />
        </View>
      ) : (
        <PaymentList
          selectedDate={selectedDate}
          payments={selectedPayments}
          users={memberUsers}
          onDelete={handleDelete}
          onAdd={() => setShowAddModal(true)}
        />
      )}

      <AddPaymentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        groupId={group.id}
        userId={user.uid}
        defaultDate={selectedDate}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  calendarContainer: {},
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 24,
  },
});
