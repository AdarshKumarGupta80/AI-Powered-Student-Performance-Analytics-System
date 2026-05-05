import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

function Field({ label, name, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label style={{
        fontSize: 12, color: 'var(--color-text-secondary)',
        display: 'block', marginBottom: 5,
      }}>{label}</label>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(name, e.target.value)}
        style={{ width: '100%' }}
        autoComplete="off"
      />
    </div>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await authAPI.registerStudent({
        name:     form.name,
        email:    form.email,
        password: form.password,
        role:     'STUDENT',
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login?registered=true');
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        'Registration failed. This email may already be registered.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-background-tertiary)', padding: '40px 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '36px 40px',
      }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 20, fontWeight: 500,
                        color: 'var(--color-text-primary)' }}>
            Create student account
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)',
                        marginTop: 4 }}>
            Register to view your academic performance
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 99,
          background: '#EEEDFE', marginBottom: 24,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%',
                        background: '#7F77DD' }} />
          <span style={{ fontSize: 12, fontWeight: 500,
                         color: '#3C3489' }}>Student account</span>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          autoComplete="off"
        >
          <Field label="Full name"        name="name"
            placeholder="Rahul Sharma"
            value={form.name}            onChange={handleChange} />
          <Field label="Email address"    name="email"     type="email"
            placeholder="rahul@student.com"
            value={form.email}           onChange={handleChange} />
          <Field label="Password"         name="password"  type="password"
            placeholder="Min. 6 characters"
            value={form.password}        onChange={handleChange} />
          <Field label="Confirm password" name="confirmPassword" type="password"
            placeholder="Repeat your password"
            value={form.confirmPassword} onChange={handleChange} />

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--border-radius-md)',
              background: 'var(--color-background-danger)',
              color: 'var(--color-text-danger)', fontSize: 13,
            }}>{error}</div>
          )}

          {success && (
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--border-radius-md)',
              background: '#E1F5EE', color: '#085041', fontSize: 13, fontWeight: 500,
            }}>{success}</div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '11px', fontSize: 14, fontWeight: 500,
            background: loading ? '#AFA9EC' : '#7F77DD',
            color: '#fff', border: 'none',
            borderRadius: 'var(--border-radius-md)',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 4, transition: 'background .15s',
          }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center',
                      fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#7F77DD',
                                     textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}