import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EmployeeHome } from './pages/EmployeeHome';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { WidgetPage } from './pages/WidgetPage';

export function App() {
  const hasToken = Boolean(localStorage.getItem('moodaily-token'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmployeeHome />} />
        <Route path="/widget" element={<WidgetPage />} />
        <Route
          path="/admin"
          element={hasToken ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
        />
        <Route
          path="/admin/dashboard"
          element={hasToken ? <AdminDashboard /> : <Navigate to="/admin" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
