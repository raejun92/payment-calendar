import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { formatCurrency } from '@/utils/calendar';

interface CalendarHeaderProps {
  year: number;
  month: number;
  monthlyTotal: number;
}

export function CalendarHeader({ year, month, monthlyTotal }: CalendarHeaderProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{year}년 {month}월</ThemedText>
      <ThemedText style={styles.total}>{formatCurrency(monthlyTotal)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
