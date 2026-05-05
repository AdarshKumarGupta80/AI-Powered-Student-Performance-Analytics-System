import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, teacherOnly = false }) {
  const { token, isTeacher, isStudent, studentId, ready } = useAuth();

  if (!ready) return null;

  if (!token) return <Navigate to="/login" replace />;

  if (teacherOnly && !isTeacher) {
    if (isStudent && studentId) {
      return <Navigate to={`/dashboard/${studentId}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}