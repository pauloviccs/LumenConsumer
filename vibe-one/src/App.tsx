import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Kitchen } from './pages/Kitchen';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { ConnectionBanner } from './components/ConnectionBanner';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null; // Or a spinner
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-20">
        <ConnectionBanner />
        <Outlet />
      </div>
    </div>
  );
};

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground font-sans antialiased">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kitchen" element={<Kitchen />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
