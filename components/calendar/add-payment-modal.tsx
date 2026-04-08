import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { BankNames, type BankCode } from '@/types/payment';
import { addPayment } from '@/services/payments';

interface AddPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  userId: string;
  defaultDate: string;
}

function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const bankCodes = Object.keys(BankNames) as BankCode[];

export function AddPaymentModal({ visible, onClose, groupId, userId, defaultDate }: AddPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [storeName, setStoreName] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankCode>('kb');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(getCurrentTime());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const amountNum = parseInt(amount, 10);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('오류', '올바른 금액을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await addPayment(groupId, {
        amount: amountNum,
        date,
        time: `${time}:00`,
        bank: selectedBank,
        storeName: storeName || undefined,
        userId,
        groupId,
      });
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('오류', '결제 내역 추가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setStoreName('');
    setSelectedBank('kb');
    setTime(getCurrentTime());
  };

  // defaultDate가 바뀌면 반영
  React.useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <ThemedText style={styles.cancelText}>취소</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>결제 추가</ThemedText>
            <TouchableOpacity onPress={handleSubmit} disabled={loading}>
              <ThemedText style={[styles.submitText, loading && styles.disabledText]}>
                {loading ? '저장 중...' : '저장'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <ThemedText style={styles.label}>금액 (필수)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />

            <ThemedText style={styles.label}>가맹점명</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="예: 스타벅스"
              value={storeName}
              onChangeText={setStoreName}
              placeholderTextColor="#999"
            />

            <ThemedText style={styles.label}>은행/카드</ThemedText>
            <View style={styles.bankContainer}>
              {bankCodes.map((code) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.bankButton,
                    selectedBank === code && styles.bankButtonSelected,
                  ]}
                  onPress={() => setSelectedBank(code)}
                >
                  <ThemedText
                    style={[
                      styles.bankText,
                      selectedBank === code && styles.bankTextSelected,
                    ]}
                  >
                    {BankNames[code]}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.label}>시간</ThemedText>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="HH:mm"
              placeholderTextColor="#999"
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  disabledText: {
    opacity: 0.5,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 44,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000',
  },
  bankContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  bankButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  bankText: {
    fontSize: 13,
    color: '#333',
  },
  bankTextSelected: {
    color: '#fff',
  },
});
