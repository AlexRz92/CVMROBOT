import { useEffect, useState } from 'react';
import { DollarSign, Send, Wallet, LogOut as LogOutIcon, MessageSquare, Clock, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserCapital,
  investCapital,
  withdrawCapital,
  UserCapital,
  getCalculatedBalance,
  getBotActivation,
  BotActivation,
  getActivePlans,
  SubscriptionPlan,
  getUserPlan,
  UserPlan,
  createPlanChangeRequest,
} from '../lib/supabase';

interface TelegramAnnouncement {
  id: number;
  text: string;
  date: number;
  hasPhoto: boolean;
  hasVideo: boolean;
  hasDocument: boolean;
}

export default function DashboardView() {
  const { user } = useAuth();
  const [botActivation, setBotActivation] = useState<BotActivation | null>(null);
  const [capital, setCapital] = useState<UserCapital | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<TelegramAnnouncement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [investForm, setInvestForm] = useState({ exchange: 'binance', amount: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanForChange, setSelectedPlanForChange] = useState<SubscriptionPlan | null>(null);
  const [showPlanWarningModal, setShowPlanWarningModal] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [botAct, userCapital, calculatedBalance, currentUserPlan] = await Promise.all([
        getBotActivation(user.id),
        getUserCapital(user.id),
        getCalculatedBalance(user.id),
        getUserPlan(user.id),
      ]);

      setBotActivation(botAct);
      setCapital(userCapital);
      setBalance(calculatedBalance);
      setUserPlan(currentUserPlan);
      setLoading(false);
    };

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-announcements`;
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      } catch (error) {
        console.error('Error loading announcements:', error);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    loadAnnouncements();

    const interval = setInterval(() => {
      loadAnnouncements();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      const activePlans = await getActivePlans();
      setPlans(activePlans);
      setLoadingPlans(false);
    };

    loadPlans();

    const interval = setInterval(() => {
      loadPlans();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    setError('');

    if (!user || !investForm.amount) {
      setError('Por favor completa todos los campos');
      return;
    }

    const amount = parseInt(investForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser un número entero mayor a 0');
      return;
    }

    if (investForm.amount.includes('.') || investForm.amount.includes(',')) {
      setError('No se aceptan decimales');
      return;
    }

    setSubmitting(true);

    try {
      const result = await investCapital(user.id, investForm.exchange, amount);

      if (result) {
        setShowInvestModal(false);
        setInvestForm({ exchange: 'binance', amount: '' });
        const [userCapital, calculatedBalance] = await Promise.all([
          getUserCapital(user.id),
          getCalculatedBalance(user.id),
        ]);
        setCapital(userCapital);
        setBalance(calculatedBalance);
      } else {
        setError('Error al invertir capital');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al invertir capital');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await withdrawCapital(user.id);

      if (result) {
        setShowWithdrawModal(false);
        const [userCapital, calculatedBalance] = await Promise.all([
          getUserCapital(user.id),
          getCalculatedBalance(user.id),
        ]);
        setCapital(userCapital);
        setBalance(calculatedBalance);
      } else {
        setError('Error al retirar capital');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al retirar capital');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlanClick = (plan: SubscriptionPlan) => {
    if (userPlan && userPlan.plan_id === plan.id) {
      return;
    }

    setSelectedPlanForChange(plan);
    setShowPlanModal(true);
  };

  const handleConfirmPlanSelection = () => {
    setShowPlanModal(false);
    setShowPlanWarningModal(true);
  };

  const handleConfirmPlanChange = async () => {
    if (!user || !selectedPlanForChange) return;

    setSubmitting(true);
    setError('');

    try {
      const result = await createPlanChangeRequest(user.id, selectedPlanForChange.id);

      if (result) {
        setShowPlanWarningModal(false);
        setSelectedPlanForChange(null);
        alert('Solicitud de cambio de plan enviada. Espera la aprobación del operador.');
      } else {
        setError('Error al crear la solicitud de cambio de plan');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
      return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else if (days < 7) {
      return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Capital</h3>
          </div>

          {capital ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 border border-emerald-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Capital Invertido</p>
                    <p className="text-xs text-gray-400 capitalize">{capital.exchange}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">${capital.capital_amount.toFixed(2)}</p>
                </div>
              </div>

              <button
                onClick={() => setShowWithdrawModal(true)}
                className="w-full group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full transition-transform duration-500"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <LogOutIcon className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-bold text-white">Retiro Completo</p>
                    <p className="text-xs text-white/80">Cambiar de exchange</p>
                  </div>
                </div>
              </button>

              {userPlan && userPlan.plan && (
                <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Plan Activo</p>
                  <p className="text-lg font-bold text-cyan-400">{userPlan.plan.name}</p>
                  <p className="text-xs text-gray-300 mt-1">{userPlan.plan.description}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-6 text-gray-400">
                <Wallet className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="mb-2 text-sm">No tienes capital invertido</p>
                <p className="text-xs">Invierte en un exchange para comenzar</p>
              </div>

              <button
                onClick={() => setShowInvestModal(true)}
                className="w-full group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full transition-transform duration-500"></div>
                <div className="relative flex items-center justify-center gap-2">
                  <DollarSign className="w-5 h-5 text-white" />
                  <div>
                    <p className="text-sm font-bold text-white">Invertir Capital</p>
                    <p className="text-xs text-white/80">Elige un exchange</p>
                  </div>
                </div>
              </button>

              {userPlan && userPlan.plan && (
                <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Plan Activo</p>
                  <p className="text-lg font-bold text-cyan-400">{userPlan.plan.name}</p>
                  <p className="text-xs text-gray-300 mt-1">{userPlan.plan.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border border-cyan-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Actualiza tu Plan</h3>
          </div>

          {loadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p className="text-sm">No hay planes disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const isCurrentPlan = userPlan && userPlan.plan_id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanClick(plan)}
                    className={`bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border rounded-lg p-4 transition-all cursor-pointer ${
                      isCurrentPlan
                        ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-2 ring-emerald-500/50'
                        : 'border-cyan-700/30 hover:border-cyan-500/50 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{plan.name}</h4>
                        {isCurrentPlan && (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      <span className="text-lg font-bold text-cyan-400">${plan.price}</span>
                    </div>
                    <p className="text-xs text-gray-300 mb-2">{plan.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{plan.duration_days} dias</span>
                      {isCurrentPlan && (
                        <span className="text-emerald-400 font-medium">Plan Actual</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6 flex flex-col">
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
            <h3 className="text-lg font-bold text-white">Exchange Conectado</h3>
            <span className="text-xs text-gray-400">Estado</span>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Binance', key: 'binance' },
              { name: 'Blofin', key: 'blofin' },
              { name: 'Bybit', key: 'bybit' },
            ].map((exchange) => {
              const isConnected = capital?.exchange === exchange.key && capital?.is_connected;

              return (
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
                      {isConnected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-blue-950"></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{exchange.name}</span>
                      {isConnected && (
                        <span className="text-sm text-cyan-400 font-medium">
                          ${capital?.capital_amount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`font-medium ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-sm border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Anuncios del Canal</h3>
          </div>

          {loadingAnnouncements ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-500" />
              <p className="text-sm">No hay anuncios recientes</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-4 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {formatDate(announcement.date)}
                      </span>
                    </div>
                    {(announcement.hasPhoto || announcement.hasVideo || announcement.hasDocument) && (
                      <div className="flex gap-1">
                        {announcement.hasPhoto && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">Foto</span>
                        )}
                        {announcement.hasVideo && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Video</span>
                        )}
                        {announcement.hasDocument && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Doc</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                    {announcement.text.length > 200
                      ? `${announcement.text.substring(0, 200)}...`
                      : announcement.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-blue-700/30">
            <a
              href="https://t.me/CVMResearch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
            >
              <Send className="w-4 h-4" />
              Ver canal completo
            </a>
          </div>
        </div>
      </div>

      {showInvestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-emerald-400">Invertir Capital</h3>
              <button
                onClick={() => {
                  setShowInvestModal(false);
                  setError('');
                  setSubmitting(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <form onSubmit={handleInvest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Exchange</label>
                <select
                  value={investForm.exchange}
                  onChange={(e) => setInvestForm({ ...investForm, exchange: e.target.value })}
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
                  value={investForm.amount}
                  onChange={(e) => setInvestForm({ ...investForm, amount: e.target.value })}
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
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Procesando...' : 'Invertir'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-red-400">Retiro Completo</h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setError('');
                  setSubmitting(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-400 text-sm font-medium mb-2">Advertencia</p>
                <p className="text-white text-sm">
                  Al retirar el capital completo, desconectarás el exchange actual y podrás invertir en uno diferente.
                </p>
              </div>

              {capital && (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-1">Capital a retirar:</p>
                  <p className="text-2xl font-bold text-white capitalize">
                    ${capital.capital_amount.toFixed(2)} - {capital.exchange}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm mt-4">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setError('');
                  setSubmitting(false);
                }}
                disabled={submitting}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && selectedPlanForChange && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">Confirmar Selección de Plan</h3>
            <p className="text-white mb-6">
              ¿Deseas seleccionar el plan <span className="font-bold text-cyan-400">{selectedPlanForChange.name}</span>?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowPlanModal(false);
                  setSelectedPlanForChange(null);
                }}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleConfirmPlanSelection}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Si
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlanWarningModal && selectedPlanForChange && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-yellow-500/30 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Advertencia Importante</h3>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-white font-medium mb-2">
                Los días que restan no se agregan al nuevo plan
              </p>
              <p className="text-gray-300 text-sm">
                Al cambiar al plan <span className="font-bold text-cyan-400">{selectedPlanForChange.name}</span>,
                perderás los días restantes de tu plan actual y comenzarás con el nuevo plan desde cero.
              </p>
            </div>
            <p className="text-white mb-6">
              ¿Estás seguro de que deseas continuar?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowPlanWarningModal(false);
                  setSelectedPlanForChange(null);
                }}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleConfirmPlanChange}
                disabled={submitting}
                className="flex-1 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Procesando...' : 'Si, continuar'}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
