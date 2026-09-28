import { apiRequest } from './api';

export type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  published_year?: number;
  description: string;
  cover_color: string;
};

export type BookInput = Omit<Book, 'id'>;

export function getBooks(token: string, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<Book[]>(`/books${query}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function getBook(token: string, id: string) {
  return apiRequest<Book>(`/books/${id}`, { headers: { Authorization: `Bearer ${token}` } });
}

export function createBook(token: string, input: BookInput) {
  return apiRequest<Book>('/books', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
}

export function deleteBook(token: string, id: number) {
  return apiRequest<void>(`/books/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
}
