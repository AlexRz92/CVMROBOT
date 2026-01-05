import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getBotStatus,
  getAllExchangeStatuses,
  getUserBalance,
  getUserDeposits,
  getUserWithdrawals,
  UserBalance,
  Deposit,
  Withdrawal,
} from '../lib/supabase';

export default function DashboardView() {
  const { user } = useAuth();
  const [botActive, setBotActive] = useState(false);
  const [exchangeStatus, setExchangeStatus] = useState({ binance: false, blofin: false, bybit: false });
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1W');

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [bot, exchanges, userBalance, userDeposits, userWithdrawals] = await Promise.all([
        getBotStatus(user.id),
        getAllExchangeStatuses(user.id),
        getUserBalance(user.id),
        getUserDeposits(user.id),
        getUserWithdrawals(user.id),
      ]);

      setBotActive(bot);
      setExchangeStatus(exchanges);
      setBalance(userBalance);
      setDeposits(userDeposits);
      setWithdrawals(userWithdrawals);
      setLoading(false);
    };

    loadData();
  }, [user]);

  const recentDeposits = deposits.filter(d => d.status === 'approved').slice(0, 2);
  const recentWithdrawals = withdrawals.filter(w => w.status === 'approved').slice(0, 2);

  const chartPoints = [
    { x: 15, y: 70 },
    { x: 25, y: 55 },
    { x: 35, y: 45 },
    { x: 45, y: 50 },
    { x: 55, y: 40 },
    { x: 65, y: 35 },
    { x: 75, y: 25 },
    { x: 85, y: 20 },
  ];

  const pathD = `M ${chartPoints.map((p, i) => `${p.x * 8},${150 - p.y * 1.5}`).join(' L ')}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Saldo Disponible</p>
              <h2 className="text-5xl font-bold text-white">
                ${balance ? parseFloat(balance.balance.toString()).toFixed(2) : '0.00'}
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Total Retirado: <span className="text-white">${balance ? parseFloat(balance.total_withdrawn.toString()).toFixed(2) : '0.00'}</span>
              </p>
            </div>

            <div className="flex gap-2">
              {['1D', '1W', '1M', 'YTD'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    selectedPeriod === period
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-blue-800/50'
                  }`}
                >
                  {period}
                </button>
              ))}
              <button className="px-3 py-1 text-sm text-gray-400 hover:text-white">
                Tramos ▼
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-cyan-400">Rendimiento</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-emerald-400">+ 5.75%</span>
              <span className="text-xl font-semibold text-white">$1,530.75</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-400 mt-1">
              <span>Entrada: 05:27.50</span>
              <span>$1.50.06</span>
            </div>
          </div>

          <div className="relative h-40 mb-4">
            <svg className="w-full h-full" viewBox="0 0 700 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path
                d={`${pathD} L 680,150 L 120,150 Z`}
                fill="url(#gradient)"
              />

              <path
                d={pathD}
                fill="none"
                stroke="rgb(34, 211, 238)"
                strokeWidth="2"
              />

              {chartPoints.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x * 8}
                  cy={150 - point.y * 1.5}
                  r="4"
                  fill="rgb(34, 211, 238)"
                />
              ))}
            </svg>

            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
              <span>Apr 17</span>
              <span>Apr 18</span>
              <span>Apr 19</span>
              <span>Apr 19</span>
              <span>Apr 31</span>
              <span>Apr 24</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Última operación: Ventas BTC/USD 0.005 BTC - $140.35</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Tiempo Activo: 00d 00h</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Estado del Bot</h3>

          <div className="flex justify-center mb-4">
            <img
              src="/timo_das.png"
              alt="Bot"
              className={`w-32 h-32 ${botActive ? 'animate-pulse drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]' : 'opacity-50'}`}
            />
          </div>

          <div className="text-center mb-6">
            <p className={`text-2xl font-bold ${botActive ? 'text-emerald-400' : 'text-red-400'}`}>
              {botActive ? 'Activo' : 'Inactivo'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {botActive ? 'Bot operando normalmente' : 'No hay exchanges conectados'}
            </p>
          </div>

          {!botActive && (
            <button className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all">
              Conectar Exchange
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Exchanges Conectados</h3>
            <span className="text-xs text-gray-400">Últimos 7 días</span>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Binance', icon: '🟡', status: exchangeStatus.binance },
              { name: 'Blofin', icon: '🔴', status: exchangeStatus.blofin },
              { name: 'Bybit', icon: '🟠', status: exchangeStatus.bybit },
            ].map((exchange) => (
              <div key={exchange.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{exchange.icon}</span>
                  <span className="font-semibold text-white">{exchange.name}</span>
                </div>
                <span className={`font-medium ${exchange.status ? 'text-emerald-400' : 'text-red-400'}`}>
                  {exchange.status ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Solo permitidos de trading - sin retiros
          </p>
        </div>

        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Plan Actual</h3>
            <button className="text-xs text-cyan-400 hover:text-cyan-300">
              Ver plan
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="text-xl font-bold text-white">Demo</span>
              <span className="ml-auto text-sm text-gray-400">FT9-60024</span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-emerald-400">✓</span>
                <span>Acceso completo al bot</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-emerald-400">✓</span>
                <span>Hasta 1 exchange conectado</span>
              </div>
            </div>

            <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium rounded-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Actualizar Plan
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Historial de Transacciones</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">to: 17.2024</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400">24.2024</span>
            </div>
            <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Ver todo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {recentDeposits.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 border border-emerald-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 text-xl">↓</span>
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Depósito</p>
                  <p className="text-xs text-gray-400">Depósito Íntegro de Gaspas</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <p>Tramos: espera 8:15 min</p>
                  <p>X: Sus Beato</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Mínimus 55</p>
                  <p className="text-2xl font-bold text-emerald-400">$600.00</p>
                </div>
              </div>
            </div>
          )}

          {recentWithdrawals.length > 0 && (
            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-xl">↑</span>
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Retiro</p>
                  <p className="text-xs text-gray-400">Retiro fondos de tu...</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <p>Tiempo: última 10:55 min</p>
                  <p>Por: $100.00</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Mínimus 55</p>
                  <p className="text-2xl font-bold text-blue-400">$100.00</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-800/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Fecha</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Exchange</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Par</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tipo</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Monto</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ganancia/Pérdida</th>
              </tr>
            </thead>
            <tbody>
              {[...deposits.slice(0, 2), ...withdrawals.slice(0, 2)].map((transaction, i) => (
                <tr key={i} className="border-b border-blue-800/30 hover:bg-blue-800/20 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{transaction.exchange === 'binance' ? '🟡' : transaction.exchange === 'blofin' ? '🔴' : '🟠'}</span>
                      <span className="text-sm text-white capitalize">{transaction.exchange}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">BTC/USD</td>
                  <td className="py-3 px-4 text-sm text-gray-300">Compra</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-300">
                    ${parseFloat(transaction.amount.toString()).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-medium text-emerald-400">+ $12.00</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
