import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import TitleBar from './components/TitleBar';
import BackgroundBlobs from './components/BackgroundBlobs';
import LoginPage from './pages/LoginPage';
import CreateAccountPage from './pages/CreateAccountPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

// Layout wrapper to conditionally show blobs
const AppLayout = () => {
  const location = useLocation();
  const showBlobs = ['/', '/create-account'].includes(location.pathname);

  return (
    <>
      <TitleBar />
      {showBlobs && <BackgroundBlobs />}
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/create-account" element={<CreateAccountPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
