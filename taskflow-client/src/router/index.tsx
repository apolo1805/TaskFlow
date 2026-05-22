import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage     from '../pages/LoginPage';
import RegisterPage  from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import BoardPage     from '../pages/BoardPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(state => state.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
};

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/board/:id" element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}