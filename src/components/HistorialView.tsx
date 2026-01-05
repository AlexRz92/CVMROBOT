import { useEffect, useState } from 'react';
import { Calendar, Filter, Download, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserDeposits,
  getUserWithdrawals,
  Deposit,
  Withdrawal,
} from '../lib/supabase';

export default function HistorialView() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposits' | 'withdrawals'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [userDeposits, userWithdrawals] = await Promise.all([
        getUserDeposits(user.id),
        getUserWithdrawals(user.id),
      ]);

      setDeposits(userDeposits);
      setWithdrawals(userWithdrawals);
      setLoading(false);
    };

    loadData();
  }, [user]);

  const allTransactions = [
    ...deposits.map(d => ({ ...d, type: 'deposit' as const })),
    ...withdrawals.map(w => ({ ...w, type: 'withdrawal' as const })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filteredTransactions = allTransactions.filter(t => {
    if (filter === 'deposits' && t.type !== 'deposit') return false;
    if (filter === 'withdrawals' && t.type !== 'withdrawal') return false;
    if (searchTerm && !t.exchange.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Historial de Transacciones</h2>
            <p className="text-gray-400">Visualiza todas tus operaciones y movimientos</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 bg-blue-950/50 border border-blue-700/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-blue-950/50 border border-blue-700/30 rounded-lg text-gray-300 hover:text-white hover:border-cyan-500 transition-all">
              <Calendar className="w-4 h-4" />
              <span>Rango de Fechas</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-cyan-500 text-white'
                : 'bg-blue-950/50 text-gray-400 hover:text-white hover:bg-blue-800/50'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('deposits')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'deposits'
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-950/50 text-gray-400 hover:text-white hover:bg-blue-800/50'
            }`}
          >
            Depósitos
          </button>
          <button
            onClick={() => setFilter('withdrawals')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'withdrawals'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-950/50 text-gray-400 hover:text-white hover:bg-blue-800/50'
            }`}
          >
            Retiros
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando transacciones...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">No hay transacciones que mostrar</p>
            <p className="text-sm text-gray-500">Tus depósitos y retiros aparecerán aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-800/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Exchange</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Par</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Monto</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">Estado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Ganancia/Pérdida</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={`${transaction.type}-${transaction.id}`}
                    className="border-b border-blue-800/30 hover:bg-blue-800/20 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-gray-300">
                      {new Date(transaction.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {transaction.exchange === 'binance' ? '🟡' : transaction.exchange === 'blofin' ? '🔴' : '🟠'}
                        </span>
                        <span className="text-sm text-white font-medium capitalize">{transaction.exchange}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'deposit'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {transaction.type === 'deposit' ? 'Compra' : 'Venta'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-300">BTC/USD</td>
                    <td className="py-4 px-4 text-sm text-right font-medium text-white">
                      ${parseFloat(transaction.amount.toString()).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : transaction.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {transaction.status === 'approved'
                          ? 'Aprobado'
                          : transaction.status === 'rejected'
                          ? 'Rechazado'
                          : 'Pendiente'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-medium text-emerald-400">+ $12.00</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-2">Total Depositado</p>
          <p className="text-3xl font-bold text-emerald-400">
            $
            {deposits
              .filter(d => d.status === 'approved')
              .reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0)
              .toFixed(2)}
          </p>
          <p className="text-sm text-gray-400 mt-1">{deposits.filter(d => d.status === 'approved').length} depósitos</p>
        </div>

        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-2">Total Retirado</p>
          <p className="text-3xl font-bold text-blue-400">
            $
            {withdrawals
              .filter(w => w.status === 'approved')
              .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0)
              .toFixed(2)}
          </p>
          <p className="text-sm text-gray-400 mt-1">{withdrawals.filter(w => w.status === 'approved').length} retiros</p>
        </div>

        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-2">Ganancia Neta</p>
          <p className="text-3xl font-bold text-cyan-400">$1,530.75</p>
          <p className="text-sm text-emerald-400 mt-1">+5.75% rendimiento</p>
        </div>
      </div>
    </div>
  );
}
