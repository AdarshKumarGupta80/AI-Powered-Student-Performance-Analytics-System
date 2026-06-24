import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [ready,   setReady]   = useState(false); 

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem('user');
    } finally {
      setReady(true); 
    }
  }, []);

  const login = (authResponse) => {
    const u = {
      token:     authResponse.token,
      email:     authResponse.email,
      role:      authResponse.role,
      name:      authResponse.name,
      studentId: authResponse.studentId || null,
    };
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      ready,
      token:     user?.token     || null,
      role:      user?.role      || null,
      studentId: user?.studentId || null,
      isTeacher: user?.role === 'TEACHER' || user?.role === 'ADMIN',
      isStudent: user?.role === 'STUDENT',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);