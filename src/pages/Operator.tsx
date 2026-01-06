import { useState, useEffect } from 'react';
import { Download, Upload, CheckCircle, XCircle, History, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  Deposit,
  Withdrawal,
  getPendingDeposits,
  getPendingWithdrawals,
  getApprovedDeposits,
  getRejectedDeposits,
  getApprovedWithdrawals,
  getRejectedWithdrawals,
  approveDeposit,
  rejectDeposit,
  approveWithdrawal,
  rejectWithdrawal,
} from '../lib/supabase';

type View = 'deposits' | 'withdrawals';
type SubView = 'pending' | 'approved' | 'rejected';

export default function Operator() {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<View>('deposits');
  const [subView, setSubView] = useState<SubView>('pending');
  const [pendingDeposits, setPendingDeposits] = useState<Deposit[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [approvedDeposits, setApprovedDeposits] = useState<Deposit[]>([]);
  const [rejectedDeposits, setRejectedDeposits] = useState<Deposit[]>([]);
  const [approvedWithdrawals, setApprovedWithdrawals] = useState<Withdrawal[]>([]);
  const [rejectedWithdrawals, setRejectedWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Deposit | Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (user && !user.is_operator) {
      window.location.href = '/';
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [
      pendingDeps,
      pendingWiths,
      approvedDeps,
      rejectedDeps,
      approvedWiths,
      rejectedWiths,
    ] = await Promise.all([
      getPendingDeposits(),
      getPendingWithdrawals(),
      getApprovedDeposits(),
      getRejectedDeposits(),
      getApprovedWithdrawals(),
      getRejectedWithdrawals(),
    ]);

    setPendingDeposits(pendingDeps);
    setPendingWithdrawals(pendingWiths);
    setApprovedDeposits(approvedDeps);
    setRejectedDeposits(rejectedDeps);
    setApprovedWithdrawals(approvedWiths);
    setRejectedWithdrawals(rejectedWiths);
    setLoading(false);
  };

  const handleApprove = async (item: Deposit | Withdrawal, type: 'deposit' | 'withdrawal') => {
    if (!user) return;

    const success = type === 'deposit'
      ? await approveDeposit(item.id, user.id)
      : await approveWithdrawal(item.id, user.id);

    if (success) {
      await loadData();
    }
  };

  const handleReject = async () => {
    if (!user || !selectedItem || !rejectionReason.trim()) return;

    const isDeposit = view === 'deposits';
    const success = isDeposit
      ? await rejectDeposit(selectedItem.id, user.id, rejectionReason)
      : await rejectWithdrawal(selectedItem.id, user.id, rejectionReason);

    if (success) {
      setShowRejectModal(false);
      setSelectedItem(null);
      setRejectionReason('');
      await loadData();
    }
  };

  const openRejectModal = (item: Deposit | Withdrawal) => {
    setSelectedItem(item);
    setShowRejectModal(true);
  };

  const getExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'binance':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'blofin':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'bybit':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
    }
  };

  const renderItems = () => {
    let items: (Deposit | Withdrawal)[] = [];

    if (view === 'deposits') {
      if (subView === 'pending') items = pendingDeposits;
      if (subView === 'approved') items = approvedDeposits;
      if (subView === 'rejected') items = rejectedDeposits;
    } else {
      if (subView === 'pending') items = pendingWithdrawals;
      if (subView === 'approved') items = approvedWithdrawals;
      if (subView === 'rejected') items = rejectedWithdrawals;
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          No hay {view === 'deposits' ? 'depósitos' : 'retiros'} {
            subView === 'pending' ? 'pendientes' :
            subView === 'approved' ? 'aprobados' : 'rechazados'
          }
        </div>
      );
    }

    const groupedByExchange = {
      binance: items.filter((item) => item.exchange === 'binance'),
      blofin: items.filter((item) => item.exchange === 'blofin'),
      bybit: items.filter((item) => item.exchange === 'bybit'),
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['binance', 'blofin', 'bybit'] as const).map((exchange) => (
          <div key={exchange} className="space-y-4">
            <h3 className="text-xl font-bold text-white capitalize flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getExchangeColor(exchange).split(' ')[0]}`}></div>
              {exchange}
            </h3>

            {groupedByExchange[exchange].length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-6 text-center text-gray-500">
                Sin movimientos
              </div>
            ) : (
              groupedByExchange[exchange].map((item) => (
                <div
                  key={item.id}
                  className={`bg-slate-800/50 backdrop-blur-xl border rounded-xl p-6 space-y-3 ${getExchangeColor(item.exchange)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Monto</span>
                    <span className="text-2xl font-bold text-white">
                      ${parseFloat(item.amount.toString()).toFixed(2)}
                    </span>
                  </div>

                  {item.user && (
                    <>
                      <div className="border-t border-slate-700 pt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Nombre</span>
                          <span className="text-sm text-white font-medium">
                            {item.user.nombre} {item.user.apellido}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Telegram</span>
                          <span className="text-sm text-cyan-400">@{item.user.nick_telegram}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Fecha</span>
                    <span className="text-sm text-white">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {item.rejection_reason && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3">
                      <p className="text-xs text-red-400 font-medium mb-1">Motivo del rechazo:</p>
                      <p className="text-sm text-red-300">{item.rejection_reason}</p>
                    </div>
                  )}

                  {subView === 'pending' && (
                    <div className="flex gap-2 pt-3">
                      <button
                        onClick={() => handleApprove(item, view === 'deposits' ? 'deposit' : 'withdrawal')}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprobar
                      </button>
                      <button
                        onClick={() => openRejectModal(item)}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!user || !user.is_operator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Acceso denegado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10 max-w-7xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Panel de Operador
          </h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(34,211,238,0.15)] mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => { setView('deposits'); setSubView('pending'); }}
              className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                view === 'deposits'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <Download className="w-6 h-6" />
              Depósitos
            </button>
            <button
              onClick={() => { setView('withdrawals'); setSubView('pending'); }}
              className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 ${
                view === 'withdrawals'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <Upload className="w-6 h-6" />
              Retiros
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-[0_0_50px_rgba(34,211,238,0.15)] mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setSubView('pending')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                subView === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setSubView('approved')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                subView === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Aprobados
            </button>
            <button
              onClick={() => setSubView('rejected')}
              className={`flex-1 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                subView === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Rechazados
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          {loading ? (
            <div className="text-center py-12 text-cyan-400">Cargando...</div>
          ) : (
            renderItems()
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-red-400 mb-4">Rechazar {view === 'deposits' ? 'Depósito' : 'Retiro'}</h3>
            <p className="text-gray-300 mb-4">Por favor, indica el motivo del rechazo:</p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[120px] resize-none"
              placeholder="Describe el motivo del rechazo..."
              autoFocus
            />

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedItem(null);
                  setRejectionReason('');
                }}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
