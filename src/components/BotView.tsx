import { useEffect, useState } from 'react';
import { Power, Settings, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getBotStatus,
  updateBotStatus,
  getAllExchangeStatuses,
  updateExchangeStatus,
} from '../lib/supabase';

export default function BotView() {
  const { user } = useAuth();
  const [botActive, setBotActive] = useState(false);
  const [exchangeStatus, setExchangeStatus] = useState({ binance: false, blofin: false, bybit: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [bot, exchanges] = await Promise.all([
        getBotStatus(user.id),
        getAllExchangeStatuses(user.id),
      ]);

      setBotActive(bot);
      setExchangeStatus(exchanges);
      setLoading(false);
    };

    loadData();
  }, [user]);

  const handleToggleBot = async () => {
    if (!user) return;
    const newStatus = !botActive;
    await updateBotStatus(user.id, newStatus);
    setBotActive(newStatus);
  };

  const handleToggleExchange = async (exchange: string) => {
    if (!user) return;
    const newStatus = !exchangeStatus[exchange as keyof typeof exchangeStatus];
    await updateExchangeStatus(user.id, exchange, newStatus);
    setExchangeStatus({ ...exchangeStatus, [exchange]: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Control del Bot</h2>
            <p className="text-gray-400">Gestiona el estado y configuración de tu bot de trading</p>
          </div>
          <div className="w-32 h-32">
            <img
              src="/timo_das.png"
              alt="Bot"
              className={`w-full h-full ${botActive ? 'animate-pulse drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]' : 'opacity-50'}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  botActive ? 'bg-emerald-500/20' : 'bg-red-500/20'
                }`}>
                  <Power className={`w-6 h-6 ${botActive ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Estado del Bot</p>
                  <p className={`text-xl font-bold ${botActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {botActive ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleBot}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  botActive ? 'bg-emerald-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    botActive ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-400">
              {botActive
                ? 'El bot está ejecutando operaciones automáticamente'
                : 'Activa el bot para comenzar a operar'}
            </p>
          </div>

          <div className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Settings className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Configuración</p>
                <p className="text-xl font-bold text-white">Modo Automático</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              El bot opera de forma autónoma según los parámetros configurados
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Exchanges Conectados</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'binance', name: 'Binance', icon: '🟡', color: 'yellow' },
            { key: 'blofin', name: 'Blofin', icon: '🔴', color: 'red' },
            { key: 'bybit', name: 'Bybit', icon: '🟠', color: 'orange' },
          ].map((exchange) => {
            const isActive = exchangeStatus[exchange.key as keyof typeof exchangeStatus];
            return (
              <div
                key={exchange.key}
                className={`bg-blue-950/50 border rounded-lg p-6 transition-all ${
                  isActive ? 'border-emerald-500/50' : 'border-blue-700/30'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{exchange.icon}</span>
                    <div>
                      <p className="font-bold text-white">{exchange.name}</p>
                      <p className={`text-sm ${isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isActive ? 'Conectado' : 'Desconectado'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleExchange(exchange.key)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      isActive ? 'bg-emerald-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isActive && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>API Key:</span>
                      <span className="text-white">Configurada</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Estado:</span>
                      <span className="text-emerald-400">Operativo</span>
                    </div>
                  </div>
                )}

                {!isActive && (
                  <button className="w-full mt-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium">
                    Conectar {exchange.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
          <p className="text-sm text-yellow-300">
            <span className="font-semibold">Nota:</span> Solo se permiten operaciones de trading. Los retiros están
            deshabilitados por seguridad.
          </p>
        </div>
      </div>

      <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Estadísticas de Rendimiento</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-gray-400">Ganancias Totales</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">$1,530.75</p>
            <p className="text-sm text-gray-400 mt-1">+5.75% este mes</p>
          </div>

          <div className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-gray-400">Operaciones</span>
            </div>
            <p className="text-3xl font-bold text-white">142</p>
            <p className="text-sm text-gray-400 mt-1">Este mes</p>
          </div>

          <div className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Tasa de Éxito</span>
            </div>
            <p className="text-3xl font-bold text-white">78%</p>
            <p className="text-sm text-gray-400 mt-1">Operaciones exitosas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
