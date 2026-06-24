import { useEffect, useMemo, useState } from 'react';
import { Bell, Menu, Moon, Sun } from 'lucide-react';

import Sidebar from './Sidebar';
import ChatWidget from './ChatWidget';

import { Button } from './ui/DashboardPrimitives';
import { useAuth } from '../context/AuthContext';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dark, setDark] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  const { user } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);

    localStorage.setItem(
      'theme',
      dark ? 'dark' : 'light'
    );
  }, [dark]);

  const roleLabel = useMemo(() => {
    if (user?.role === 'ADMIN') {
      return 'Admin command center';
    }

    if (user?.role === 'TEACHER') {
      return 'Teacher analytics workspace';
    }

    if (user?.role === 'PARENT') {
      return 'Parent progress view';
    }

    return 'Student progress workspace';
  }, [user?.role]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">

        <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">

          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="ml-auto flex items-center gap-2">

              <p className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 md:block">
                {roleLabel}
              </p>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>

              <Button
                variant="secondary"
                size="icon"
                onClick={() => setDark((value) => !value)}
                aria-label="Toggle dark mode"
              >
                {dark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        <main className="app-scrollbar mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}