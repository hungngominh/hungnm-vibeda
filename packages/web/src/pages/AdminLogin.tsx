import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { api } from '../lib/api';

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await api.login(username, password);
      localStorage.setItem('moodaily-token', token);
      navigate('/admin/dashboard');
    } catch {
      setError('Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    border: '1.5px solid var(--border)', fontFamily: 'var(--font)',
    fontSize: 15, outline: 'none', background: 'var(--surface)', color: 'var(--text)',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--surface)', padding: 24,
    }}>
      <Card style={{ maxWidth: 360, width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 28, color: 'var(--primary)' }}>
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text" placeholder="Tên đăng nhập"
            value={username} onChange={e => setUsername(e.target.value)}
            required style={inputStyle}
          />
          <input
            type="password" placeholder="Mật khẩu"
            value={password} onChange={e => setPassword(e.target.value)}
            required style={inputStyle}
          />
          {error && <p style={{ color: '#e53935', fontSize: 13 }}>{error}</p>}
          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
