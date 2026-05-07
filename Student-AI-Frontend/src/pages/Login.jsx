import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Brain, GraduationCap, Lock, Mail, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card } from '../components/ui/DashboardPrimitives';
import { cn } from '../lib/cn';

const ROLES = [
  {
    key: 'TEACHER',
    label: 'Teacher',
    color: 'indigo',
    icon: Users,
  },
  {
    key: 'STUDENT',
    label: 'Student',
    color: 'emerald',
    icon: GraduationCap,
  },
];

const highlights = [
  { title: 'Predict performance', sub: 'AI-powered score and risk forecasting.', icon: Brain },
  { title: 'Act on risk early', sub: 'Clear recommendations before students fall behind.', icon: ShieldCheck },
  { title: 'Understand trends', sub: 'Attendance, marks, and engagement in one workspace.', icon: BarChart3 },
];

export default function Login() {
  const [role, setRole] = useState('TEACHER');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const active = ROLES.find((item) => item.key === role);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(form);
      const data = response.data;

      if (data.role !== role) {
        setError(`This account is a ${data.role} account. Please select ${data.role} before signing in.`);
        setLoading(false);
        return;
      }

      login(data);

      if (data.role === 'STUDENT') {
        if (data.studentId) {
          navigate(`/dashboard/${data.studentId}`, { replace: true });
        } else {
          setError('Student profile not found for this email. Ask your teacher to link your account, or re-register.');
          setLoading(false);
        }
      } else {
        navigate('/students', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[minmax(360px,0.88fr)_minmax(520px,1.12fr)]">
        <section className="relative hidden overflow-hidden bg-slate-950 px-8 py-10 text-white lg:flex lg:flex-col xl:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(79,70,229,0.32),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.18),transparent_30%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold">StudentAI</p>
                <p className="text-sm text-slate-400">Academic intelligence platform</p>
              </div>
            </div>

            <div className="mx-auto flex min-h-[calc(100vh-190px)] max-w-lg flex-col justify-center">
              <Badge tone="indigo" className="bg-white/10 text-indigo-100 ring-white/15 w-fit">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered education analytics
              </Badge>
              <div className="mt-6 grid gap-3">
                {highlights.map(({ title, sub, icon: Icon }) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{title}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-400">{sub}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-5 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-4 flex items-center justify-center gap-3 lg:hidden sm:mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-slate-950 dark:text-white">StudentAI</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Academic intelligence</p>
              </div>
            </div>

            <Card className="p-4 sm:p-7">
              <div className="mb-4 sm:mb-6">
                
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:mt-4 sm:text-2xl">Welcome back</h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500 dark:text-slate-400 sm:mt-2">
                  Sign in to continue to your {active.label.toLowerCase()} workspace.
                </p>
              </div>

              <div className="mb-4 grid gap-2 sm:mb-5 sm:grid-cols-2 sm:gap-3">
                {ROLES.map((item) => {
                  const Icon = item.icon;
                  const selected = role === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setRole(item.key)}
                      className={cn(
                        'rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-4 sm:p-4',
                        selected
                          ? 'border-indigo-300 bg-indigo-50 ring-indigo-500/10 dark:border-indigo-500/40 dark:bg-indigo-500/10'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl',
                          selected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
                        )}>
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.key}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:mt-3">{item.desc}</p>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label htmlFor="email">Email address</label>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@school.com"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password">Password</label>
                  <div className="relative mt-2">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(event) => setForm({ ...form, password: event.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </div>
                )}

                <Button type="submit" className="h-11 w-full" disabled={loading}>
                  {loading ? 'Signing in...' : `Sign in as ${active.label.toLowerCase()}`}
                  {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </form>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
