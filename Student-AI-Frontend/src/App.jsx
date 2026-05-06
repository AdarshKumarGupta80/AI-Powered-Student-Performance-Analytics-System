import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell       from './components/AppShell';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Students       from './pages/Students';
import StudentDetail  from './pages/StudentDetail';
import Dashboard      from './pages/Dashboard';
import Predictions    from './pages/Predictions';

function Layout({ children }) {
  return <AppShell>{children}</AppShell>;
}

function P({ children, teacherOnly = false }) {
  return (
    <ProtectedRoute teacherOnly={teacherOnly}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function HomeRedirect() {
  const { ready, token, isStudent, studentId } = useAuth();

  if (!ready) return null; 

  if (!token) return <Navigate to="/login" replace />;

  if (isStudent && studentId) {
    return <Navigate to={`/dashboard/${studentId}`} replace />;
  }

  return <Navigate to="/students" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<HomeRedirect />} />

          <Route path="/students" element={
            <P teacherOnly><Students /></P>
          }/>
          <Route path="/students/:id" element={
            <P teacherOnly><StudentDetail /></P>
          }/>
          <Route path="/predictions" element={
            <P teacherOnly><Predictions /></P>
          }/>

          <Route path="/dashboard/:id" element={
            <P><Dashboard /></P>
          }/>

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
