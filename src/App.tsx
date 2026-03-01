import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGardenStore } from './store/useStore';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useFirestoreSync } from './hooks/useFirestoreSync';
import SignInPage from './components/Auth/SignInPage';
import Layout from './components/Layout/Layout';
import Onboarding from './pages/Onboarding/Onboarding';
import Dashboard from './pages/Dashboard/Dashboard';
import SeedDatabase from './pages/Seeds/SeedDatabase';
import PlantingCalendar from './pages/Calendar/PlantingCalendar';
import TaskList from './pages/Tasks/TaskList';
import SeedInventory from './pages/Inventory/SeedInventory';
import GardenJournal from './pages/Journal/GardenJournal';
import Settings from './pages/Settings/Settings';
import WhatCanIPlant from './pages/Tools/WhatCanIPlant';

function AppRoutes() {
  const onboardingCompleted = useGardenStore((s) => s.settings.onboardingCompleted);

  if (!onboardingCompleted) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/seeds" element={<SeedDatabase />} />
        <Route path="/calendar" element={<PlantingCalendar />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/inventory" element={<SeedInventory />} />
        <Route path="/journal" element={<GardenJournal />} />
        <Route path="/tools" element={<WhatCanIPlant />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function AuthenticatedApp() {
  const { ready } = useFirestoreSync();

  if (!ready) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppRoutes />;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <SignInPage />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
