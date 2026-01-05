import { LogOut, Download, Upload, Wallet, History, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import {
  getBotStatus,
  getAllExchangeStatuses,
  getUserBalance,
  getUserDeposits,
  getUserWithdrawals,
  createDeposit,
  createWithdrawal,
  UserBalance,
  Deposit,
  Withdrawal,
} from '../lib/supabase';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [botActive, setBotActive] = useState(false);
  const [exchangeStatus, setExchangeStatus] = useState({ binance: false, blofin: false, bybit: false });
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [depositForm, setDepositForm] = useState({ exchange: 'binance', amount: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ exchange: 'binance', amount: '' });
  const [error, setError] = useState('');

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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !depositForm.amount) {
      setError('Por favor completa todos los campos');
      return;
    }

    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser mayor a 0');
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

    const amount = parseFloat(withdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (balance && amount > balance.balance) {
      setError('Saldo insuficiente');
      return;
    }

    try {
      const result = await createWithdrawal(user.id, withdrawalForm.exchange, amount);

      if (result) {
        setShowWithdrawalModal(false);
        setWithdrawalForm({ exchange: 'binance', amount: '' });
        const [userBalance, userWithdrawals] = await Promise.all([
          getUserBalance(user.id),
          getUserWithdrawals(user.id),
        ]);
        setBalance(userBalance);
        setWithdrawals(userWithdrawals);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el retiro');
    }
  };

  const getExchangesWithBalance = () => {
    if (!deposits) return [];

    const exchangeBalances: Record<string, number> = {
      binance: 0,
      blofin: 0,
      bybit: 0,
    };

    deposits.forEach((deposit) => {
      if (deposit.status === 'approved') {
        exchangeBalances[deposit.exchange] = (exchangeBalances[deposit.exchange] || 0) + parseFloat(deposit.amount.toString());
      }
    });

    withdrawals.forEach((withdrawal) => {
      if (withdrawal.status === 'approved') {
        exchangeBalances[withdrawal.exchange] = (exchangeBalances[withdrawal.exchange] || 0) - parseFloat(withdrawal.amount.toString());
      }
    });

    return Object.entries(exchangeBalances)
      .filter(([_, balance]) => balance > 0)
      .map(([exchange]) => exchange);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10 max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            CVM Research
          </h1>
          <div className="flex gap-3">
            {user.is_operator && (
              <a
                href="/operator"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'operator';
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Wallet className="w-4 h-4" />
                Panel Operador
              </a>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-12 shadow-[0_0_50px_rgba(34,211,238,0.15)] mb-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between gap-8">
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-2">Usuario</p>
                <h2 className="text-3xl font-bold text-white mb-3">{user.nombre} {user.apellido}</h2>
                <p className="text-gray-300 text-base mb-2">{user.email}</p>
                <p className="text-gray-400 text-base">@{user.nick_telegram}</p>
              </div>
              <div className="text-right flex-1">
                <p className="text-sm text-gray-400 mb-2">Saldo Disponible</p>
                <h3 className="text-4xl font-bold text-white mb-4">
                  ${balance ? parseFloat(balance.balance.toString()).toFixed(2) : '0.00'}
                </h3>
                <div className="text-base">
                  <span className="text-gray-400">Total Retirado: </span>
                  <span className="text-blue-400 font-semibold">
                    ${balance ? parseFloat(balance.total_withdrawn.toString()).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`rounded-2xl p-8 backdrop-blur-xl border-2 transition-all ${botActive ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300 mb-2">Estado del Bot</p>
                <p className={`text-3xl font-bold ${botActive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {botActive ? 'Activo' : 'Inactivo'}
                </p>
              </div>
              <div className="relative w-60 h-60 flex items-center justify-center">
                <img
                  src="/timo_das.png"
                  alt="Bot Status"
                  className={`max-w-full max-h-full object-contain ${botActive ? 'animate-pulse drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'opacity-50'}`}
                />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-8 backdrop-blur-xl border-2 transition-all bg-slate-800/30 border-cyan-500/30`}>
            <p className="text-sm text-gray-300 mb-4">Exchanges Conectados</p>
            <div className="space-y-3">
              {['binance', 'blofin', 'bybit'].map((exchange) => (
                <div key={exchange} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${exchangeStatus[exchange as keyof typeof exchangeStatus] ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`}></div>
                    <span className="text-white font-semibold capitalize">{exchange}</span>
                  </div>
                  <span className={`text-sm font-medium ${exchangeStatus[exchange as keyof typeof exchangeStatus] ? 'text-emerald-400' : 'text-red-400'}`}>
                    {exchangeStatus[exchange as keyof typeof exchangeStatus] ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)] mb-8">
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition-all"
            >
              <History className="w-5 h-5" />
              Ver Historial de Transacciones
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setShowDepositModal(true)}
            className="group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full transition-transform duration-500"></div>
            <div className="relative flex flex-col items-center gap-4">
              <div className="rounded-full bg-white/20 p-4">
                <Download className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Depósito</p>
                <p className="text-sm text-white/80">Deposita fondos en tu cuenta</p>
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
            className="group relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full transition-transform duration-500"></div>
            <div className="relative flex flex-col items-center gap-4">
              <div className="rounded-full bg-white/20 p-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Retiro</p>
                <p className="text-sm text-white/80">Retira fondos de tu cuenta</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-cyan-400">Nuevo Depósito</h3>
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
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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
                  step="0.01"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="0.00"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all"
              >
                Solicitar Depósito
              </button>
            </form>
          </div>
        </div>
      )}

      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-cyan-400">Nuevo Retiro</h3>
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

            <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-400">
                Saldo disponible: <span className="font-bold">${balance ? parseFloat(balance.balance.toString()).toFixed(2) : '0.00'}</span>
              </p>
            </div>

            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Exchange</label>
                <select
                  value={withdrawalForm.exchange}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, exchange: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  disabled={getExchangesWithBalance().length === 0}
                >
                  {getExchangesWithBalance().length === 0 ? (
                    <option value="">No hay exchanges con saldo</option>
                  ) : (
                    getExchangesWithBalance().map((exchange) => (
                      <option key={exchange} value={exchange} className="capitalize">
                        {exchange.charAt(0).toUpperCase() + exchange.slice(1)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="0.00"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={getExchangesWithBalance().length === 0}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Solicitar Retiro
              </button>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-cyan-400">Historial de Transacciones</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-green-400 mb-4">Depósitos</h4>
                {deposits.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No hay depósitos registrados</p>
                ) : (
                  <div className="space-y-3">
                    {deposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-semibold capitalize">{deposit.exchange}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              deposit.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              deposit.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {deposit.status === 'approved' ? 'Aprobado' :
                               deposit.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {new Date(deposit.created_at).toLocaleString()}
                          </p>
                          {deposit.rejection_reason && (
                            <p className="text-xs text-red-400 mt-2">Motivo: {deposit.rejection_reason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-400">
                            +${parseFloat(deposit.amount.toString()).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xl font-semibold text-blue-400 mb-4">Retiros</h4>
                {withdrawals.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No hay retiros registrados</p>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-semibold capitalize">{withdrawal.exchange}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              withdrawal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                              withdrawal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {withdrawal.status === 'approved' ? 'Aprobado' :
                               withdrawal.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {new Date(withdrawal.created_at).toLocaleString()}
                          </p>
                          {withdrawal.rejection_reason && (
                            <p className="text-xs text-red-400 mt-2">Motivo: {withdrawal.rejection_reason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-400">
                            -${parseFloat(withdrawal.amount.toString()).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 