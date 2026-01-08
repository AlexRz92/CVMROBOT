import { useState } from 'react';
import { Lock, Mail, ArrowLeft, XCircle } from 'lucide-react';
import { login } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export default function Login({ onNavigate }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const { refreshUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (!result) {
        throw new Error('Correo o contraseña incorrectos');
      }

      if (result.error === 'rejected') {
        setShowRejectedModal(true);
        setLoading(false);
        return;
      }

      if (result.error === 'pending') {
        throw new Error('Tu cuenta está pendiente de aprobación. Por favor espera a que un operador la apruebe.');
      }

      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => onNavigate('landing')}
          className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Iniciar Sesión
          </h2>
          <p className="text-gray-400 text-center mb-8">Accede a tu cuenta</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border  rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => onNavigate('recovery')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Registrarse
              </button>
            </div>
          </form>
        </div>
      </div>

      {showRejectedModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="relative max-w-2xl w-full">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>

            <div className="relative bg-slate-900 border-4 border-red-600 rounded-3xl p-8 shadow-[0_0_100px_rgba(220,38,38,0.8)]">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    setShowRejectedModal(false);
                    setEmail('');
                    setPassword('');
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="w-8 h-8" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative w-64 h-64 rounded-2xl overflow-hidden shadow-2xl"> 
                  <img
                    src="/lol.png"
                    alt="Acceso Denegado"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="256" height="256"%3E%3Crect width="256" height="256" fill="%23991b1b"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="120" fill="white"%3E🚫%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-900/50 to-transparent"></div>
                </div>

                <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" style={{ fontFamily: 'Impact, fantasy' }}>
                  NOS RESERVAMOS
                </h2>

                <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 animate-pulse drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]" style={{ fontFamily: 'Impact, fantasy' }}>
                  EL DERECHO
                </h3>

                <h3 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]" style={{ fontFamily: 'Impact, fantasy' }}>
                  DE ADMISIÓN
                </h3>

                <div className="w-full h-2 bg-gradient-to-r from-transparent via-red-600 to-transparent rounded-full"></div>

                <button
                  onClick={() => {
                    setShowRejectedModal(false);
                    setEmail('');
                    setPassword('');
                  }}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-red-600 to-red-800 text-white text-xl font-bold rounded-lg hover:shadow-[0_0_40px_rgba(220,38,38,0.8)] transition-all transform hover:scale-105"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
