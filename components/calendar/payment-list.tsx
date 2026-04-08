import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { formatCurrency } from '@/utils/calendar';
import type { Payment } from '@/types/payment';

interface UserInfo {
  displayName: string;
  color: string;
}

interface PaymentListProps {
  selectedDate: string;
  payments: Payment[];
  users: Record<string, UserInfo>;
  onDelete?: (paymentId: string) => void;
  onAdd?: () => void;
}

function getInitial(displayName: string): string {
  return displayName.charAt(0);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00+09:00');
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[date.getDay()];
  return `${month}월 ${day}일 (${dayName})`;
}

function formatTime(time: string): string {
  return time.substring(0, 5);
}

function handleDeletePress(paymentId: string, onDelete?: (id: string) => void) {
  if (!onDelete) return;
  Alert.alert('삭제 확인', '이 결제 내역을 삭제하시겠습니까?', [
    { text: '취소', style: 'cancel' },
    { text: '삭제', style: 'destructive', onPress: () => onDelete(paymentId) },
  ]);
}

export function PaymentList({ selectedDate, payments, users, onDelete, onAdd }: PaymentListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
        <ThemedText style={styles.dateTitle}>{formatDate(selectedDate)}</ThemedText>
        {onAdd && (
          <TouchableOpacity onPress={onAdd} style={styles.addButton}>
            <ThemedText style={styles.addButtonText}>+</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>결제 내역이 없습니다</ThemedText>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const user = users[item.userId];
            const initial = user ? getInitial(user.displayName) : '?';
            const color = user?.color ?? '#999';

            return (
              <TouchableOpacity
                style={styles.item}
                onLongPress={() => handleDeletePress(item.id, onDelete)}
              >
                <View style={[styles.initialBadge, { backgroundColor: color }]}>
                  <ThemedText style={styles.initialText}>{initial}</ThemedText>
                </View>
                <ThemedText style={styles.time}>{formatTime(item.time)}</ThemedText>
                <ThemedText style={styles.storeName} numberOfLines={1}>
                  {item.storeName ?? '결제'}
                </ThemedText>
                <ThemedText style={styles.amount}>{formatCurrency(item.amount)}</ThemedText>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginTop: -1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  initialBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  initialText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  time: {
    fontSize: 14,
    color: '#666',
    width: 45,
  },
  storeName: {
    flex: 1,
    fontSize: 14,
    marginHorizontal: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
