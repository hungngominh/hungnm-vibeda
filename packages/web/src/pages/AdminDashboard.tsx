import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/StatCard';
import { EntryTable, type EntryRow } from '../components/EntryTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { api } from '../lib/api';

const PAGE_SIZE = 20;

function subtractDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

type DateFilter = 'today' | 'week' | 'month' | 'all';

const FILTER_CONFIG: { key: DateFilter; label: string; chipVariant: 'mint' | 'pink' | 'blue' | 'yellow' }[] = [
  { key: 'today', label: 'Hôm nay',  chipVariant: 'mint'   },
  { key: 'week',  label: '7 ngày',   chipVariant: 'pink'   },
  { key: 'month', label: '30 ngày',  chipVariant: 'blue'   },
  { key: 'all',   label: 'Tất cả',   chipVariant: 'yellow' },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [keyword, setKeyword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [error, setError] = useState<string | null>(null);

  function logout() {
    localStorage.removeItem('moodaily-token');
    navigate('/admin');
  }

  const loadEntries = useCallback(async () => {
    setError(null);
    try {
      const params: Parameters<typeof api.getEntries>[0] = { page, pageSize: PAGE_SIZE };
      if (dateFilter === 'today') params.date = new Date().toISOString().slice(0, 10);
      if (dateFilter === 'week')  params.dateFrom = subtractDays(7);
      if (dateFilter === 'month') params.dateFrom = subtractDays(30);
      if (keyword) params.keyword = keyword;
      const res = await api.getEntries(params);
      setEntries(res.items as EntryRow[]);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load entries');
    }
  }, [page, dateFilter, keyword]);

  useEffect(() => {
    if (!localStorage.getItem('moodaily-token')) { navigate('/admin'); return; }
    loadEntries();
  }, [loadEntries, navigate]);

  useEffect(() => {
    Promise.all([
      api.getEntries({ pageSize: 1, date: new Date().toISOString().slice(0, 10) }),
      api.getEntries({ pageSize: 1, dateFrom: subtractDays(7) }),
      api.getEntries({ pageSize: 1, dateFrom: subtractDays(30) }),
    ]).then(([today, week, month]) => {
      setStats({ today: today.total, week: week.total, month: month.total });
    }).catch(() => {});
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteEntry(deleteTarget);
      setDeleteTarget(null);
      loadEntries();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete entry');
      setDeleteTarget(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>

      {/* Header */}
      <header style={{
        padding: '20px var(--pad-container)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)',
      }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
            Mood Admin
          </div>
          <div style={{ fontSize: 16, color: 'var(--on-surface-variant)', marginTop: 2 }}>
            Tổng quan cảm xúc nội bộ
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>Đăng xuất</Button>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--pad-container) 40px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Hôm nay"   value={stats.today} variant="mint" />
          <StatCard label="7 ngày"    value={stats.week}  variant="pink" />
          <StatCard label="30 ngày"   value={stats.month} variant="blue" />
        </div>

        {/* Filter chips + search */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          {FILTER_CONFIG.map(f => (
            <Chip
              key={f.key}
              label={f.label}
              variant={f.chipVariant}
              onClick={() => { setDateFilter(f.key); setPage(1); }}
              style={dateFilter === f.key ? { boxShadow: '0 0 0 2px var(--primary)' } : undefined}
            />
          ))}
          <input
            placeholder="🔍 Tìm kiếm nội dung..."
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setPage(1); }}
            style={{
              marginLeft: 'auto',
              padding: '8px 16px',
              borderRadius: 'var(--r-full)',
              border: '2px solid transparent',
              background: 'var(--surface-container)',
              fontFamily: 'var(--font)', fontSize: 13,
              outline: 'none', color: 'var(--on-surface)',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-fixed-dim)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fff3f3', border: '1px solid #e53935', borderRadius: 'var(--r)',
            padding: '12px 16px', color: '#c62828', fontSize: 14, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Entry table */}
        <div style={{
          background: 'var(--container-lowest)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-soft)',
          overflow: 'hidden',
        }}>
          <EntryTable entries={entries} onDelete={id => setDeleteTarget(id)} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
            <span style={{ padding: '6px 12px', color: 'var(--on-surface)', fontSize: 14 }}>
              {page} / {totalPages}
            </span>
            <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        message="Bạn có chắc muốn xóa entry này? Hành động không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
