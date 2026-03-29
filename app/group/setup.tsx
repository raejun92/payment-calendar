import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createGroup, joinGroup, getGroup } from '@/services/auth';
import { useAuth } from '@/contexts/auth-context';

export default function GroupSetupScreen() {
  const { user, setGroup } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [groupName, setGroupName] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!user) return;
    if (!groupName) {
      Alert.alert('오류', '그룹 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const group = await createGroup(user.uid, groupName);
      setCreatedCode(group.inviteCode);
      setGroup(group);
    } catch (error: any) {
      Alert.alert('오류', '그룹 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user) return;
    if (!inviteCode) {
      Alert.alert('오류', '초대 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const group = await joinGroup(user.uid, inviteCode.toUpperCase());
      setGroup(group);
    } catch (error: any) {
      Alert.alert('오류', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (createdCode) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>그룹 생성 완료!</ThemedText>
        <ThemedText style={styles.description}>
          아래 초대 코드를 상대방에게 알려주세요.
        </ThemedText>
        <ThemedView style={styles.codeBox}>
          <ThemedText style={styles.code}>{createdCode}</ThemedText>
        </ThemedView>
        <ThemedText style={styles.description}>
          상대방이 이 코드를 입력하면 같은 달력을 공유합니다.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>그룹 설정</ThemedText>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">새 그룹 만들기</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="그룹 이름 (예: 우리 가계부)"
          value={groupName}
          onChangeText={setGroupName}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>그룹 만들기</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.divider}>
        <ThemedText style={styles.dividerText}>또는</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">초대 코드로 참여</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="6자리 초대 코드"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          maxLength={6}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]}
          onPress={handleJoinGroup}
          disabled={loading}
        >
          <ThemedText style={styles.buttonSecondaryText}>참여하기</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerText: {
    color: '#999',
    fontSize: 14,
  },
  description: {
    textAlign: 'center',
    marginVertical: 12,
    color: '#666',
    fontSize: 15,
  },
  codeBox: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 6,
  },
});
