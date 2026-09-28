import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BookCard } from '@/components/book-card';
import { Page } from '@/components/page';
import { TopNav } from '@/components/top-nav';
import { useAuth } from '@/providers/auth-provider';
import { getBooks } from '@/services/books';

export default function LibraryPage() {
  const { token, user } = useAuth();
  const [search, setSearch] = useState('');
  const books = useQuery({ queryKey: ['books', search], queryFn: () => getBooks(token!, search), enabled: Boolean(token) });

  if (!token) return <Page><TopNav /><View style={styles.welcome}><Text style={styles.eyebrow}>YOUR PERSONAL LIBRARY</Text><Text style={styles.hero}>Good books, <Text style={styles.accent}>well kept.</Text></Text><Text style={styles.copy}>A calm home for the stories you want to remember, wherever you read.</Text><Pressable style={styles.primary} onPress={() => router.push('/sign-in')}><Text style={styles.primaryText}>Enter the library  →</Text></Pressable></View></Page>;

  return <Page><TopNav /><View style={styles.headingRow}><View><Text style={styles.eyebrow}>ALL BOOKS · {user?.role === 'admin' ? 'LIBRARIAN VIEW' : 'READER VIEW'}</Text><Text style={styles.title}>Your library.</Text><Text style={styles.subtitle}>The next good read is probably already here.</Text></View><View style={styles.stat}><Text style={styles.statNumber}>{books.data?.length ?? '—'}</Text><Text style={styles.statLabel}>BOOKS</Text></View></View><View style={styles.toolbar}><TextInput value={search} onChangeText={setSearch} placeholder="Search title, author, or genre" placeholderTextColor="#9ba69e" style={styles.search} /><Link href="/explore" asChild><Pressable style={styles.secondary}><Text style={styles.secondaryText}>Discover</Text></Pressable></Link></View>{books.isPending ? <ActivityIndicator color="#bc634d" style={styles.loader} /> : books.isError ? <Text style={styles.error}>{books.error.message}</Text> : <View>{books.data?.map((book) => <BookCard key={book.id} book={book} />)}</View>}</Page>;
}
const styles = StyleSheet.create({ welcome: { flex: 1, justifyContent: 'center', paddingVertical: 80, maxWidth: 700 }, eyebrow: { color: '#bc634d', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }, hero: { color: '#1f2926', fontSize: 48, lineHeight: 53, fontWeight: '900', letterSpacing: -2, marginTop: 18 }, accent: { color: '#bc634d' }, copy: { color: '#6f7b73', fontSize: 17, lineHeight: 26, maxWidth: 430, marginTop: 16 }, primary: { alignSelf: 'flex-start', backgroundColor: '#1f2926', paddingHorizontal: 20, paddingVertical: 15, borderRadius: 8, marginTop: 28 }, primaryText: { color: '#fff', fontWeight: '800' }, headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 26 }, title: { color: '#1f2926', fontSize: 38, fontWeight: '900', letterSpacing: -1.5, marginTop: 9 }, subtitle: { color: '#6f7b73', marginTop: 5 }, stat: { borderLeftWidth: 1, borderLeftColor: '#dedfd7', paddingLeft: 20, minWidth: 74 }, statNumber: { color: '#1f2926', fontSize: 28, fontWeight: '900' }, statLabel: { color: '#9ba69e', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 }, toolbar: { flexDirection: 'row', gap: 10, marginBottom: 18 }, search: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e1d8', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, color: '#1f2926' }, secondary: { borderWidth: 1, borderColor: '#1f2926', borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center' }, secondaryText: { color: '#1f2926', fontWeight: '800' }, loader: { marginTop: 40 }, error: { color: '#b4493b', marginTop: 20 } });
