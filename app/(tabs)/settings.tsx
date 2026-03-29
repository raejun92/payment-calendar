import { StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { logout } from '@/services/auth';
import { useAuth } from '@/contexts/auth-context';

export default function SettingsScreen() {
  const { user, group } = useAuth();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>설정</ThemedText>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">계정</ThemedText>
        <ThemedText>{user?.displayName}</ThemedText>
        <ThemedText style={styles.secondary}>{user?.email}</ThemedText>
      </ThemedView>

      {group && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">그룹</ThemedText>
          <ThemedText>{group.name}</ThemedText>
          <ThemedText style={styles.secondary}>
            초대 코드: {group.inviteCode}
          </ThemedText>
          <ThemedText style={styles.secondary}>
            멤버 {group.memberIds.length}명
          </ThemedText>
        </ThemedView>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutText}>로그아웃</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
    gap: 4,
  },
  secondary: {
    color: '#666',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 32,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
