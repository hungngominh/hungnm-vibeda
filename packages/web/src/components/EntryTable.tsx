import { Chip } from './Chip';
import { Button } from './Button';

export interface EntryRow {
  id: string;
  logCreatedDate: string;
  rawText: string;
  _clusterCount?: number;
}

interface EntryTableProps {
  entries: EntryRow[];
  onDelete: (id: string) => void;
}

export function EntryTable({ entries, onDelete }: EntryTableProps) {
  if (entries.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
        Không có entries
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: '10px 12px', textAlign: 'left',
    color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13,
  };
  const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 14 };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)' }}>
            <th style={thStyle}>Thời gian</th>
            <th style={thStyle}>Nội dung</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Cụm</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Xóa</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ ...tdStyle, whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                {new Date(entry.logCreatedDate).toLocaleString('vi-VN')}
              </td>
              <td style={{ ...tdStyle, maxWidth: 400 }}>
                {entry.rawText.length > 80 ? entry.rawText.slice(0, 80) + '…' : entry.rawText}
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <Chip label={String(entry._clusterCount ?? 0)} />
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => onDelete(entry.id)}
                  style={{ color: '#e53935' }}
                >
                  Xóa
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
