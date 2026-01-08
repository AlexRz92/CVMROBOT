import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordRecovery from './pages/PasswordRecovery';
import MainApp from './pages/MainApp';
import Operator from './pages/Operator';
import ChangePasswordRequired from './pages/ChangePasswordRequired';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'register' | 'recovery' | 'operator'>('landing');
  const { user, loading, refreshUser } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Cargando...</div>
      </div>
    );
  }

  if (user && user.is_temporary_password) {
    return (
      <ChangePasswordRequired
        user={user}
        onPasswordChanged={refreshUser}
      />
    );
  }

  if (user) {
    if (user.is_operator) {
      return <Operator />;
    }
    return <MainApp />;
  }

  switch (currentPage) {
    case 'landing':
      return <Landing onNavigate={setCurrentPage} />;
    case 'login':
      return <Login onNavigate={setCurrentPage} />;
    case 'register':
      return <Register onNavigate={setCurrentPage} />;
    case 'recovery':
      return <PasswordRecovery onNavigate={setCurrentPage} />;
    case 'operator':
      return <Operator />;
    default:
      return <Landing onNavigate={setCurrentPage} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
