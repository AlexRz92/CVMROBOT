import { useState } from 'react';
import { Home, Bot, History, MessageCircle, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DashboardView from '../components/DashboardView';
import BotView from '../components/BotView';
import HistorialView from '../components/HistorialView';
import SoporteView from '../components/SoporteView';

type Tab = 'dashboard' | 'bot' | 'historial' | 'soporte';

export default function MainApp() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <nav className="relative z-10 bg-blue-950/50 backdrop-blur-xl border-b border-blue-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/port.png" alt="CVM" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-white">CVM Research</h1>
                <p className="text-xs text-blue-300">Automatización y Análisis Profesional</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'dashboard'
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-blue-800/30'
                }`}
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('bot')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'bot'
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-blue-800/30'
                }`}
              >
                <Bot className="w-4 h-4" />
                Bot
              </button>

              <button
                onClick={() => setActiveTab('historial')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'historial'
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-blue-800/30'
                }`}
              >
                <History className="w-4 h-4" />
                Historial
              </button>

              <button
                onClick={() => setActiveTab('soporte')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'soporte'
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-blue-800/30'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Soporte
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-blue-800/50">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {user.nombre} {user.apellido}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  <User className="w-5 h-5" />
                </div>
              </div>

              <button
                onClick={signOut}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'bot' && <BotView />}
        {activeTab === 'historial' && <HistorialView />}
        {activeTab === 'soporte' && <SoporteView />}
      </main>
    </div>
  );
}
