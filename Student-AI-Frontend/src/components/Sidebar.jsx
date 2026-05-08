import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Brain,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  FileBarChart2,
  Users,
  UserPlus,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/cn';
import { Button } from './ui/DashboardPrimitives';

const teacherNav = [
  { to: '/students',    label: 'Students',      icon: Users },
  { to: '/predictions', label: 'AI Predictions', icon: Brain },
  { to: '/students?add=1', label: 'Add Student', icon: UserPlus },
];

function buildStudentNav(studentId) {
  return [
    { to: `/dashboard/${studentId}`, label: 'My Dashboard',  icon: LayoutDashboard },
    { to: '/reports',                label: 'Reports',        icon: FileBarChart2 },
    { to: '/ai-feedback',            label: 'AI Feedback',    icon: MessageSquare },
  ];
}

function initials(name = '') {
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AI';
}

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user, isTeacher, studentId, logout, ready } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  if (!ready || !user) return null;

  const primaryNav = isTeacher ? teacherNav : buildStudentNav(studentId);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const shell = (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">StudentAI</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Academic intelligence</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close navigation">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="app-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>
          <div className="space-y-1">
            {primaryNav.map(({ to, label, icon: Icon }) => {
              const [path, query = ''] = to.split('?');
              const isAddStudent = query.includes('add=1');
              const isActive =
                location.pathname === path &&
                (isAddStudent
                  ? location.search.includes('add=1')
                  : !location.search.includes('add=1'));

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              {initials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{user?.name}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{user?.role}</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-slate-500" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block">{shell}</div>
      <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'block' : 'hidden')}>
        <button className="absolute inset-0 bg-slate-950/40" aria-label="Close navigation overlay" onClick={onClose} />
        <div className={cn('relative h-full transform transition-transform duration-200', open ? 'translate-x-0' : '-translate-x-full')}>
          {shell}
        </div>
      </div>
    </>
  );
}
