import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Book } from '@/services/books';

export function BookCard({ book }: { book: Book }) {
  return <Link href={{ pathname: '/book/[id]', params: { id: String(book.id) } }} asChild><Pressable style={styles.card}><View style={[styles.cover, { backgroundColor: book.cover_color }]}><Text style={styles.genre}>{book.genre.toUpperCase()}</Text><Text style={styles.coverTitle}>{book.title}</Text><Text style={styles.coverAuthor}>{book.author}</Text></View><View style={styles.body}><Text style={styles.title}>{book.title}</Text><Text style={styles.author}>{book.author}</Text><Text style={styles.description} numberOfLines={3}>{book.description}</Text><View style={styles.meta}><Text style={styles.year}>{book.published_year ?? '—'}</Text><Text style={styles.isbn}>{book.isbn}</Text></View></View></Pressable></Link>;
}

const styles = StyleSheet.create({ card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e5e1d8', flexDirection: 'row', gap: 14, marginBottom: 14 }, cover: { width: 100, height: 142, borderRadius: 9, padding: 10, justifyContent: 'space-between' }, genre: { color: '#fff', opacity: 0.78, fontSize: 8, fontWeight: '800', letterSpacing: 1 }, coverTitle: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 18 }, coverAuthor: { color: '#fff', opacity: 0.8, fontSize: 10 }, body: { flex: 1, justifyContent: 'space-between', paddingVertical: 3 }, title: { color: '#1f2926', fontSize: 17, fontWeight: '800' }, author: { color: '#bc634d', fontSize: 13, fontWeight: '700', marginTop: 3 }, description: { color: '#6f7b73', fontSize: 13, lineHeight: 19, marginVertical: 8 }, meta: { flexDirection: 'row', gap: 12, alignItems: 'center' }, year: { color: '#1f2926', fontWeight: '800', fontSize: 12 }, isbn: { color: '#a0aaa3', fontSize: 10 } });
