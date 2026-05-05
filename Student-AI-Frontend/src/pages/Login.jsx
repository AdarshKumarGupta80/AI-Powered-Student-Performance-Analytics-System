import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    key:   'TEACHER',
    label: 'Teacher',
    desc:  'Full access — manage all students',
    color: '#1D9E75',
    bg:    '#E1F5EE',
    perms: ['Add & edit students', 'Upload marks', 'View all dashboards', 'Generate predictions'],
  },
  {
    key:   'STUDENT',
    label: 'Student',
    desc:  'View your own performance',
    color: '#7F77DD',
    bg:    '#EEEDFE',
    perms: ['View own dashboard', 'See AI predictions', 'Read recommendations'],
  },
];

export default function Login() {
  const [role,     setRole]     = useState('TEACHER');
  const [form,     setForm]     = useState({ email: '', password: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const active = ROLES.find(r => r.key === role);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true); setError('');
  try {
    const res = await authAPI.login(form);
    const data = res.data;

    if (data.role !== role) {
      setError(
        `This account is a ${data.role} account. Please select ${data.role} on this page.`
      );
      setLoading(false);
      return;
    }

    login(data); 

    if (data.role === 'STUDENT') {
      if (data.studentId) {
        navigate(`/dashboard/${data.studentId}`, { replace: true });
      } else {
  
        setError(
          'Student profile not found for this email. ' +
          'Ask your teacher to link your account, or re-register.'
        );
        setLoading(false);
        return;
      }
    } else {
      navigate('/students', { replace: true });
    }
  } catch (err) {
    setError(
      err.response?.data?.message ||
      err.response?.data ||
      'Invalid email or password.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--color-background-tertiary)',
    }}>
      <div style={{
        width: 380, background: '#0F6E56',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', padding: '48px 40px',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>StudentAI</div>
          <div style={{ fontSize: 13, color: '#9FE1CB', marginTop: 4 }}>
            Academic performance system
          </div>
        </div>
        <div>
          {[
            ['Predict performance', 'AI-powered score and risk forecasting'],
            ['Smart recommendations', 'Personalised advice for every student'],
            ['Real-time analytics', 'Attendance, marks, engagement — all in one view'],
          ].map(([title, sub]) => (
            <div key={title} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%',
                              background: '#5DCAA5', flexShrink: 0 }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{title}</div>
              </div>
              <div style={{ fontSize: 12, color: '#9FE1CB',
                            marginTop: 3, marginLeft: 16 }}>{sub}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#5DCAA5' }}>
          Built with Spring Boot + Python ML + React
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 20, fontWeight: 500,
                          color: 'var(--color-text-primary)' }}>
              Welcome back
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)',
                          marginTop: 4 }}>
              Sign in to your account
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: 10, marginBottom: 24 }}>
            {ROLES.map(r => (
              <div key={r.key} onClick={() => setRole(r.key)} style={{
                padding: '14px 16px', borderRadius: 'var(--border-radius-lg)',
                border: role === r.key
                  ? `1.5px solid ${r.color}`
                  : '0.5px solid var(--color-border-tertiary)',
                background: role === r.key ? r.bg : 'var(--color-background-primary)',
                cursor: 'pointer', transition: 'all .15s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: r.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 500, color: '#fff', marginBottom: 8,
                }}>
                  {r.label[0]}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500,
                              color: 'var(--color-text-primary)' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)',
                              marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <div style={{
            padding: '10px 14px', marginBottom: 20,
            background: 'var(--color-background-secondary)',
            borderRadius: 'var(--border-radius-md)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)',
                          marginBottom: 6 }}>
              {active.label} permissions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {active.perms.map(p => (
                <span key={p} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 99,
                  background: active.bg, color: active.color,
                  fontWeight: 500,
                }}>{p}</span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)',
                              display: 'block', marginBottom: 5 }}>
                Email address
              </label>
              <input type="email" required placeholder="you@school.com"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                style={{ width: '100%' }}/>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)',
                              display: 'block', marginBottom: 5 }}>
                Password
              </label>
              <input type="password" required placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                style={{ width: '100%' }}/>
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: 'var(--border-radius-md)',
                background: 'var(--color-background-danger)',
                color: 'var(--color-text-danger)', fontSize: 13,
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '11px', fontSize: 14, fontWeight: 500,
              background: active.color, color: '#fff',
              border: 'none', borderRadius: 'var(--border-radius-md)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? .7 : 1, marginTop: 4,
            }}>
              {loading ? 'Signing in...' : `Sign in as ${active.label.toLowerCase()}`}
            </button>
          </form>

          {role === 'STUDENT' && (
            <div style={{ marginTop: 20, textAlign: 'center',
                          fontSize: 13, color: 'var(--color-text-secondary)' }}>
              New student?{' '}
              <Link to="/register" style={{ color: '#7F77DD',
                                            textDecoration: 'none',
                                            fontWeight: 500 }}>
                Create your account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}