import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/providers/auth-provider';

export function TopNav() {
  const { user, signOut } = useAuth();
  return <View style={styles.row}><Pressable onPress={() => router.replace('/')}><Text style={styles.logo}>shelfwise<Text style={styles.dot}>.</Text></Text></Pressable><View style={styles.actions}><Pressable onPress={() => router.push('/explore')}><Text style={styles.link}>Discover</Text></Pressable><Pressable onPress={() => { signOut(); router.replace('/sign-in'); }}><Text style={styles.signOut}>{user ? 'Sign out' : 'Sign in'}</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }, logo: { color: '#1f2926', fontSize: 24, fontWeight: '900', letterSpacing: -1 }, dot: { color: '#bc634d' }, actions: { flexDirection: 'row', alignItems: 'center', gap: 18 }, link: { color: '#5f6f66', fontWeight: '700', fontSize: 13 }, signOut: { color: '#bc634d', fontWeight: '800', fontSize: 13 } });
