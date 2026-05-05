import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentAPI } from '../api/api';

const DEPT_COLORS = {
  'CSE':     { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  'ECE':     { bg: '#F0FDF4', color: '#065F46', dot: '#10B981' },
  'ME':      { bg: '#FEF3C7', color: '#92400E', dot: '#F59E0B' },
  'CIVIL':   { bg: '#FDF4FF', color: '#7E22CE', dot: '#A855F7' },
  'IT':      { bg: '#FFF7ED', color: '#9A3412', dot: '#F97316' },
  'DEFAULT': { bg: '#F5F3FF', color: '#4C1D95', dot: '#8B5CF6' },
};

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  const colors = [
    { bg: '#D1FAE5', color: '#065F46' },
    { bg: '#DBEAFE', color: '#1E40AF' },
    { bg: '#EDE9FE', color: '#4C1D95' },
    { bg: '#FEE2E2', color: '#991B1B' },
    { bg: '#FEF3C7', color: '#92400E' },
    { bg: '#FCE7F3', color: '#9D174D' },
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function getDeptStyle(dept) {
  return DEPT_COLORS[dept?.toUpperCase()] || DEPT_COLORS['DEFAULT'];
}

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    studentAPI.getAll()
      .then(r => setStudents(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollmentNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', fontSize: 16, color: '#6B7280',
    }}>
      Loading students...
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, fontSize: 15 }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 28,
      }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>
            Students
          </div>
          <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            {students.length} enrolled · {filtered.length} shown
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: 'Total',   value: students.length,  bg: '#EFF6FF', color: '#1D4ED8' },
            {
              label: 'Departments',
              value: [...new Set(students.map(s => s.department))].length,
              bg: '#F0FDF4', color: '#065F46',
            },
          ].map(({ label, value, bg, color }) => (
            <div key={label} style={{
              background: bg, borderRadius: 12,
              padding: '12px 18px', textAlign: 'center',
              minWidth: 90,
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input
          placeholder="Search by name, department or enrollment number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px',
            fontSize: 15, borderRadius: 12,
            border: '1.5px solid #D1D5DB',
            background: '#FAFAFA', color: '#111827',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{
          padding: '40px', textAlign: 'center',
          background: '#F9FAFB', borderRadius: 14,
          fontSize: 15, color: '#6B7280',
        }}>
          No students found matching "{search}"
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(s => {
            const avatar = getAvatarColor(s.name);
            const dept   = getDeptStyle(s.department);

            return (
              <div
                key={s.id}
                onClick={() => navigate(`/dashboard/${s.id}`)}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 16,
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all .18s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#6366F1';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center',
                              gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: avatar.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: avatar.color,
                    flexShrink: 0,
                  }}>
                    {getInitials(s.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700,
                                  color: '#111827', lineHeight: 1.2 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
                      Semester {s.semester}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8,
                              flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 99,
                    background: dept.bg, color: dept.color,
                  }}>
                    <span style={{
                      display: 'inline-block', width: 7, height: 7,
                      borderRadius: '50%', background: dept.dot,
                      marginRight: 5, verticalAlign: 'middle',
                    }}/>
                    {s.department || 'Not assigned'}
                  </span>

                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 99,
                    background: '#F3F4F6', color: '#374151',
                  }}>
                    Sem {s.semester}
                  </span>
                </div>

                <div style={{
                  fontSize: 12, color: '#9CA3AF',
                  background: '#F9FAFB',
                  padding: '6px 10px', borderRadius: 8,
                  marginBottom: 16, fontFamily: 'monospace',
                  letterSpacing: '.04em',
                }}>
                  {s.enrollmentNumber || s.email}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 700, color: '#6366F1',
                  }}>
                    View Dashboard →
                  </span>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#EEF2FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: '#6366F1',
                  }}>→</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}