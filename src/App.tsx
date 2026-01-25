import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import BackgroundBlobs from './components/BackgroundBlobs';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { usePresence } from './hooks/usePresence';
import { useFirstLaunchNotification } from './hooks/useFirstLaunchNotification';
import './App.css';

// Layout wrapper to conditionally show blobs
const AppLayout = () => {
  const location = useLocation();
  const showBlobs = ['/', '/create-account'].includes(location.pathname);

  // Track user presence (only if user exists)
  try {
    usePresence();
  } catch (error) {
    console.warn('Presence hook error:', error);
  }

  // Show welcome notification on first launch (wrapped in try-catch)
  try {
    useFirstLaunchNotification();
  } catch (error) {
    console.warn('First launch notification error:', error);
  }

  return (
    <>
      <TitleBar />
      {showBlobs && <BackgroundBlobs />}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/create-account" element={<CreateAccountPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
};

function App() {
  // Debug: Check if we can render at all
  console.log('App component rendering...');
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
  
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
