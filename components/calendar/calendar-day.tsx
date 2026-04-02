import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { formatCurrency } from '@/utils/calendar';
import { isHoliday } from '@/constants/holidays';

interface CalendarDayProps {
  date: string;
  state?: 'disabled' | 'today' | '';
  isSelected: boolean;
  dailyTotal: number;
  onPress: (date: string) => void;
}

function isSunday(date: string): boolean {
  const d = new Date(date + 'T00:00:00+09:00');
  return d.getDay() === 0;
}

function isSaturday(date: string): boolean {
  const d = new Date(date + 'T00:00:00+09:00');
  return d.getDay() === 6;
}

export function CalendarDay({ date, state, isSelected, dailyTotal, onPress }: CalendarDayProps) {
  const day = parseInt(date.split('-')[2], 10);
  const isToday = state === 'today';
  const isDisabled = state === 'disabled';
  const isRedDay = isHoliday(date) || isSunday(date);
  const isSat = isSaturday(date);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(date)}
      disabled={isDisabled}
    >
      <View
        style={[
          styles.dayCircle,
          isSelected && styles.selectedCircle,
          isToday && !isSelected && styles.todayCircle,
        ]}
      >
        <ThemedText
          style={[
            styles.dayText,
            isRedDay && !isSelected && !isDisabled && styles.holidayText,
            isSat && !isRedDay && !isSelected && !isDisabled && styles.saturdayText,
            isSelected && styles.selectedDayText,
            isDisabled && styles.disabledDayText,
          ]}
        >
          {day}
        </ThemedText>
      </View>
      {dailyTotal > 0 && !isDisabled && (
        <ThemedText style={styles.amountText} numberOfLines={1}>
          {formatCurrency(dailyTotal)}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 48,
    height: 56,
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCircle: {
    backgroundColor: '#007AFF',
  },
  todayCircle: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
  },
  disabledDayText: {
    color: '#ccc',
  },
  holidayText: {
    color: '#FF3B30',
  },
  saturdayText: {
    color: '#007AFF',
  },
  amountText: {
    fontSize: 8,
    color: '#666',
    marginTop: 1,
  },
});
