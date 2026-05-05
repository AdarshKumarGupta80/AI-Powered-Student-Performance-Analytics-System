import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, isTeacher, isStudent, studentId, logout, ready } = useAuth();
  const navigate = useNavigate();

  if (!ready || !user) return null;

  const handleLogout = () => { logout(); navigate('/login'); };


  const NAV = isTeacher ? [
    { to: '/students',    label: 'Students',       color: '#1D9E75' },
    { to: '/predictions', label: 'AI predictions', color: '#EF9F27' },
  ] : [
    { to: `/dashboard/${studentId}`, label: 'My dashboard', color: '#7F77DD' },
  ];

  const roleColor  = isTeacher ? '#1d9e5ead' : '#7F77DD';
  const roleBg     = isTeacher ? '#E1F5EE' : '#EEEDFE';
  const roleText   = isTeacher ? '#085042' : '#3C3489';

  return (
    <aside style={{
      width: 220, background: 'var(--color-background-primary)',
      borderRight: '0.5px solid var(--color-border-tertiary)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, height: '100vh',
    }}>
      <div style={{ padding: '20px 20px 16px',
                    borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ fontSize: 15, fontWeight: 500,
                      color: 'var(--color-text-primary)' }}>StudentAI</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)',
                      marginTop: 2 }}>Performance system</div>
      </div>

      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV.map(({ to, label, color }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 20px', fontSize: 13, textDecoration: 'none',
            color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            background: isActive ? 'var(--color-background-secondary)' : 'transparent',
            borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
            fontWeight: isActive ? 500 : 400,
          })}>
            <span style={{ width: 7, height: 7, borderRadius: '50%',
                           background: color, flexShrink: 0 }}/>
            {label}
          </NavLink>
        ))}

        {isTeacher && (
          <div style={{ margin: '16px 12px 8px',
                        padding: '10px 12px',
                        background: 'var(--color-background-secondary)',
                        borderRadius: 'var(--border-radius-md)' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)',
                          marginBottom: 6 }}>Quick actions</div>
            <button onClick={() => navigate('/students')} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '5px 0', fontSize: 12,
              color: 'var(--color-text-secondary)',
              background: 'none', border: 'none', cursor: 'pointer',
            }}>+ Add student</button>
          </div>
        )}
      </nav>

      <div style={{ padding: '14px 20px',
                    borderTop: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center',
                      gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: roleBg, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, color: roleText,
          }}>
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500,
                          color: 'var(--color-text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 10, padding: '1px 6px',
                          borderRadius: 99, background: roleBg,
                          color: roleText, display: 'inline-block',
                          marginTop: 2 }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          fontSize: 12, color: 'var(--color-text-secondary)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}>Sign out</button>
      </div>
    </aside>
  );
}