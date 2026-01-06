import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Calendar, Download, Upload, X, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllExchangeStatuses,
  getUserDeposits,
  getUserWithdrawals,
  createDeposit,
  createWithdrawal,
  Deposit,
  Withdrawal,
  getCalculatedBalance,
  getBotActivation,
  BotActivation,
} from '../lib/supabase';

export default function DashboardView() {
  const { user } = useAuth();
  const [botActivation, setBotActivation] = useState<BotActivation | null>(null);
  const [exchangeStatus, setExchangeStatus] = useState({ binance: false, blofin: false, bybit: false });
  const [balance, setBalance] = useState<number>(0);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('1W');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [depositForm, setDepositForm] = useState({ exchange: 'binance', amount: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ exchange: 'binance', amount: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [botAct, exchanges, calculatedBalance, userDeposits, userWithdrawals] = await Promise.all([
        getBotActivation(user.id),
        getAllExchangeStatuses(user.id),
        getCalculatedBalance(user.id),
        getUserDeposits(user.id),
        getUserWithdrawals(user.id),
      ]);

      setBotActivation(botAct);
      setExchangeStatus(exchanges);
      setBalance(calculatedBalance);
      setDeposits(userDeposits);
      setWithdrawals(userWithdrawals);
      setLoading(false);
    };

    loadData();
  }, [user]);

  const getExchangeBalances = () => {
    const balances: Record<string, number> = {
      binance: 0,
      blofin: 0,
      bybit: 0,
    };

    deposits.forEach((deposit) => {
      if (deposit.status === 'approved') {
        balances[deposit.exchange] += parseFloat(deposit.amount.toString());
      }
    });

    withdrawals.forEach((withdrawal) => {
      if (withdrawal.status === 'approved') {
        balances[withdrawal.exchange] -= parseFloat(withdrawal.amount.toString());
      }
    });

    return balances;
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !depositForm.amount) {
      setError('Por favor completa todos los campos');
      return;
    }

    const amount = parseInt(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser un número entero mayor a 0');
      return;
    }

    if (depositForm.amount.includes('.') || depositForm.amount.includes(',')) {
      setError('No se aceptan decimales');
      return;
    }

    try {
      const result = await createDeposit(user.id, depositForm.exchange, amount);

      if (result) {
        setShowDepositModal(false);
        setDepositForm({ exchange: 'binance', amount: '' });
        const [userDeposits, exchanges] = await Promise.all([
          getUserDeposits(user.id),
          getAllExchangeStatuses(user.id),
        ]);
        setDeposits(userDeposits);
        setExchangeStatus(exchanges);
      } else {
        setError('Error al crear el depósito');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el depósito');
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !withdrawalForm.amount) {
      setError('Por favor completa todos los campos');
      return;
    }

    const amount = parseInt(withdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser un número entero mayor a 0');
      return;
    }

    if (withdrawalForm.amount.includes('.') || withdrawalForm.amount.includes(',')) {
      setError('No se aceptan decimales');
      return;
    }

    const exchangeBalances = getExchangeBalances();
    const availableBalance = exchangeBalances[withdrawalForm.exchange];

    if (amount > availableBalance) {
      setError('Saldo insuficiente en este exchange');
      return;
    }

    try {
      const result = await createWithdrawal(user.id, withdrawalForm.exchange, amount);

      if (result) {
        setShowWithdrawalModal(false);
        setWithdrawalForm({ exchange: 'binance', amount: '' });
        const [calculatedBalance, userWithdrawals] = await Promise.all([
          getCalculatedBalance(user.id),
          getUserWithdrawals(user.id),
        ]);
        setBalance(calculatedBalance);
        setWithdrawals(userWithdrawals);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el retiro');
    }
  };

  const getExchangesWithBalance = () => {
    const balances = getExchangeBalances();
    return Object.entries(balances)
      .filter(([_, balance]) => balance > 0)
      .map(([exchange]) => exchange);
  };

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
    <div className="space-y-6 relative">
      <a
        href="https://t.me/CVMResearch"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 group"
        title="Soporte CVM Research"
      >
        <Send className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Saldo Disponible</p>
              <h2 className="text-5xl font-bold text-white">
                ${balance.toFixed(2)}
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Saldo total incluyendo ganancias
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

        <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-4">Estado del Bot</h3>

          <div className="flex justify-center items-center flex-1 mb-2">
            <div className="w-full h-64 rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/20 bg-gradient-to-b from-blue-900/30 to-slate-900/30 p-2">
              <img
                src="/timo_das.png"
                alt="Bot"
                className={`w-full h-full object-contain ${botActivation?.is_active ? 'animate-pulse drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]' : 'opacity-50'}`}
              />
            </div>
          </div>

          <div className="text-center">
            <p className={`text-2xl font-bold ${botActivation?.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
              {botActivation?.is_active ? 'Activo' : 'Inactivo'}
            </p>
            {botActivation?.is_active && (
              <div className="mt-3">
                <p className="text-4xl font-bold text-emerald-300">
                  {botActivation.days_remaining || 30}
                </p>
                <p className="text-sm text-emerald-400">
                  {botActivation.days_remaining === 1 ? 'día restante' : 'días restantes'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Exchanges Conectados</h3>
            <span className="text-xs text-gray-400">Estado</span>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Binance', key: 'binance', status: exchangeStatus.binance },
              { name: 'Blofin', key: 'blofin', status: exchangeStatus.blofin },
              { name: 'Bybit', key: 'bybit', status: exchangeStatus.bybit },
            ].map((exchange) => (
              <div key={exchange.name} className="flex items-center justify-between bg-blue-950/50 border border-blue-700/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                    <img
                      src={`/${exchange.key}-logo.png`}
                      alt={exchange.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-white font-bold">${exchange.name[0]}</span>`;
                        }
                      }}
                    />
                    {exchange.status && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-blue-950"></div>
                    )}
                  </div>
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
            <h3 className="text-lg font-bold text-white">Operaciones</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowDepositModal(true)}
              className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full transition-transform duration-500"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className="rounded-full bg-white/20 p-3">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Depósito</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                const exchangesWithBalance = getExchangesWithBalance();
                if (exchangesWithBalance.length > 0) {
                  setWithdrawalForm({ exchange: exchangesWithBalance[0], amount: '' });
                }
                setShowWithdrawalModal(true);
              }}
              className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full transition-transform duration-500"></div>
              <div className="relative flex flex-col items-center gap-3">
                <div className="rounded-full bg-white/20 p-3">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Retiro</p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-emerald-400">✓</span>
              <span>Depósitos instantáneos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-emerald-400">✓</span>
              <span>Retiros seguros</span>
            </div>
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
                  <p className="text-xs text-gray-400">Depósito Aprobado</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <p>Exchange: {recentDeposits[0].exchange}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">${parseFloat(recentDeposits[0].amount.toString()).toFixed(2)}</p>
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
                  <p className="text-xs text-gray-400">Retiro Aprobado</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <p>Exchange: {recentWithdrawals[0].exchange}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">${parseFloat(recentWithdrawals[0].amount.toString()).toFixed(2)}</p>
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
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tipo</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Monto</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Estado</th>
              </tr>
            </thead>
            <tbody>
              {[...deposits.slice(0, 3), ...withdrawals.slice(0, 3)].map((transaction, i) => {
                const isDeposit = 'user_id' in transaction && deposits.includes(transaction as Deposit);
                return (
                  <tr key={i} className="border-b border-blue-800/30 hover:bg-blue-800/20 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-white capitalize">{transaction.exchange}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        isDeposit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {isDeposit ? 'Depósito' : 'Retiro'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-300">
                      ${parseFloat(transaction.amount.toString()).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        transaction.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {transaction.status === 'approved' ? 'Aprobado' :
                         transaction.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-emerald-400">Nuevo Depósito</h3>
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setError('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Exchange</label>
                <select
                  value={depositForm.exchange}
                  onChange={(e) => setDepositForm({ ...depositForm, exchange: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-emerald-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="binance">Binance</option>
                  <option value="blofin">Blofin</option>
                  <option value="bybit">Bybit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Monto</label>
                <input
                  type="number"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-emerald-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="0"
                  min="1"
                  step="1"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Solo números enteros positivos</p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
              >
                Solicitar Depósito
              </button>
            </form>
          </div>
        </div>
      )}

      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-400">Nuevo Retiro</h3>
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setError('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {getExchangesWithBalance().length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No hay saldo disponible para retiro</p>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Exchange</label>
                  <select
                    value={withdrawalForm.exchange}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, exchange: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    {getExchangesWithBalance().map((exchange) => (
                      <option key={exchange} value={exchange} className="capitalize">
                        {exchange.charAt(0).toUpperCase() + exchange.slice(1)} - Saldo: ${getExchangeBalances()[exchange].toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Monto</label>
                  <input
                    type="number"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    placeholder="0"
                    min="1"
                    step="1"
                    max={getExchangeBalances()[withdrawalForm.exchange]}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Disponible: ${getExchangeBalances()[withdrawalForm.exchange].toFixed(2)}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all"
                >
                  Solicitar Retiro
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
