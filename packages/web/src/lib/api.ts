const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('moodaily-token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.errors?.[0]?.message ?? 'Request failed');
  return json.data as T;
}

export const api = {
  submitMood: (rawText: string) =>
    request<{ entryId: string; clusters: string[] }>('/mood/submit', {
      method: 'POST',
      body: JSON.stringify({ rawText }),
    }),

  getCloud: (date?: string) =>
    request<{ date: string; words: { phrase: string; count: number }[] }>(
      `/cloud${date ? `?date=${date}` : ''}`,
    ),

  login: (username: string, password: string) =>
    request<{ token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getEntries: (params: {
    page?: number;
    pageSize?: number;
    date?: string;
    dateFrom?: string;
    keyword?: string;
  }) => {
    const q = new URLSearchParams();
    if (params.page)     q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.date)     q.set('date', params.date);
    if (params.dateFrom) q.set('dateFrom', params.dateFrom);
    if (params.keyword)  q.set('keyword', params.keyword);
    return request<{ items: any[]; total: number }>(`/admin/entries/list?${q}`);
  },

  deleteEntry: (id: string) =>
    request<boolean>(`/admin/entries/delete?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
