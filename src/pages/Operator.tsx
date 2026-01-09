import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, LogOut, Power, Users, UserCheck, Wallet, Sparkles, Plus, Edit, Trash2, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllUsersWithActivation,
  UserWithActivation,
  updateBotActivation,
  PendingUser,
  getPendingUsers,
  getApprovedUsers,
  getRejectedUsers,
  approveUser,
  rejectUser,
  getUsersByExchange,
  UserByExchange,
  getAllPlans,
  SubscriptionPlan,
  createPlan,
  updatePlan,
  deletePlan,
  getPendingPlanChangeRequests,
  PlanChangeRequest,
  approvePlanChange,
  rejectPlanChange,
  getSystemConfig,
} from '../lib/supabase';

type MainView = 'bot-activation' | 'user-approval' | 'users' | 'plans' | 'plan-requests';
type SubView = 'pending' | 'approved' | 'rejected';

export default function Operator() {
  const { user, signOut } = useAuth();
  const [mainView, setMainView] = useState<MainView>('bot-activation');
  const [subView, setSubView] = useState<SubView>('pending');
  const [users, setUsers] = useState<UserWithActivation[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<PendingUser[]>([]);
  const [usersByExchange, setUsersByExchange] = useState<{
    binance: UserByExchange[];
    blofin: UserByExchange[];
    bybit: UserByExchange[];
  }>({ binance: [], blofin: [], bybit: [] });
  const [loading, setLoading] = useState(true);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithActivation | null>(null);
  const [activationDays, setActivationDays] = useState('30');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_days: '',
    features: '',
    display_order: '0',
  });
  const [planRequests, setPlanRequests] = useState<PlanChangeRequest[]>([]);
  const [plansEnabled, setPlansEnabled] = useState(true);

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
      allUsers,
      pendingUsrs,
      approvedUsrs,
      rejectedUsrs,
      usersExchange,
      allPlans,
      pendingPlanRequests,
      plansEnabledConfig,
    ] = await Promise.all([
      getAllUsersWithActivation(),
      getPendingUsers(),
      getApprovedUsers(),
      getRejectedUsers(),
      getUsersByExchange(),
      getAllPlans(),
      getPendingPlanChangeRequests(),
      getSystemConfig('plans_enabled'),
    ]);

    setUsers(allUsers);
    setPendingUsers(pendingUsrs);
    setApprovedUsers(approvedUsrs);
    setRejectedUsers(rejectedUsrs);
    setUsersByExchange(usersExchange);
    setPlans(allPlans);
    setPlanRequests(pendingPlanRequests);
    setPlansEnabled(plansEnabledConfig);
    setLoading(false);
  };

  const handleTogglePlansEnabled = async () => {
    if (!user) return;

    const newValue = !plansEnabled;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/toggle-plans-enabled`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newValue: newValue,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPlansEnabled(newValue);
      } else {
        console.error('Error toggling plans:', data.error);
      }
    } catch (error) {
      console.error('Error toggling plans:', error);
    }
  };

  const handleBotActivation = async (activate: boolean) => {
    if (!selectedUser) return;

    const days = activate ? parseInt(activationDays) || 30 : 0;

    const success = await updateBotActivation(selectedUser.id, activate, days);

    if (success) {
      setShowActivationModal(false);
      setSelectedUser(null);
      setActivationDays('30');
      await loadData();
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!user) return;

    const success = await approveUser(userId, user.id);

    if (success) {
      await loadData();
    }
  };

  const handleRejectUserSubmit = async (userId: string) => {
    if (!user) return;

    const success = await rejectUser(userId, user.id, 'Nos reservamos el derecho de admisión');

    if (success) {
      await loadData();
    }
  };

  const handleCreateOrUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const featuresArray = planForm.features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    if (editingPlan) {
      const success = await updatePlan(editingPlan.id, {
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        duration_days: parseInt(planForm.duration_days),
        features: featuresArray,
        display_order: parseInt(planForm.display_order),
      });

      if (success) {
        setShowPlanModal(false);
        setEditingPlan(null);
        setPlanForm({ name: '', description: '', price: '', duration_days: '', features: '', display_order: '0' });
        await loadData();
      }
    } else {
      const success = await createPlan({
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        duration_days: parseInt(planForm.duration_days),
        features: featuresArray,
        display_order: parseInt(planForm.display_order),
        created_by: user.id,
      });

      if (success) {
        setShowPlanModal(false);
        setPlanForm({ name: '', description: '', price: '', duration_days: '', features: '', display_order: '0' });
        await loadData();
      }
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString(),
      features: plan.features.join('\n'),
      display_order: plan.display_order.toString(),
    });
    setShowPlanModal(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('¿Estas seguro de eliminar este plan?')) return;

    const success = await deletePlan(planId);

    if (success) {
      await loadData();
    }
  };

  const handleTogglePlanStatus = async (plan: SubscriptionPlan) => {
    const success = await updatePlan(plan.id, {
      is_active: !plan.is_active,
    });

    if (success) {
      await loadData();
    }
  };

  const handleApprovePlanRequest = async (requestId: string) => {
    if (!user) return;

    const success = await approvePlanChange(requestId, user.id);

    if (success) {
      await loadData();
    }
  };

  const handleRejectPlanRequest = async (requestId: string) => {
    if (!user) return;

    const success = await rejectPlanChange(requestId, user.id);

    if (success) {
      await loadData();
    }
  };

  const renderBotActivation = () => {
    if (users.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          No hay usuarios registrados
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((userItem) => (
          <div
            key={userItem.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {userItem.nombre[0]}{userItem.apellido[0]}
                </div>
                <div>
                  <p className="font-semibold text-white">{userItem.nombre} {userItem.apellido}</p>
                  <p className="text-xs text-gray-400">@{userItem.nick_telegram}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                userItem.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {userItem.is_active ? 'Activo' : 'Inactivo'}
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Email</span>
                <span className="text-sm text-white">{userItem.email}</span>
              </div>
              {userItem.is_active && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Días restantes</span>
                    <span className="text-sm text-cyan-400 font-bold">{userItem.days_remaining}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Activado</span>
                    <span className="text-sm text-white">
                      {userItem.activated_at ? new Date(userItem.activated_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => {
                setSelectedUser(userItem);
                setShowActivationModal(true);
              }}
              className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                userItem.is_active
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              {userItem.is_active ? 'Desactivar Bot' : 'Activar Bot'}
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderUserApproval = () => {
    let users: PendingUser[] = [];

    if (subView === 'pending') users = pendingUsers;
    if (subView === 'approved') users = approvedUsers;
    if (subView === 'rejected') users = rejectedUsers;

    if (users.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          No hay usuarios {
            subView === 'pending' ? 'pendientes' :
            subView === 'approved' ? 'aprobados' : 'rechazados'
          }
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((userItem) => (
          <div
            key={userItem.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {userItem.nombre[0]}{userItem.apellido[0]}
              </div>
              <div>
                <p className="font-semibold text-white">{userItem.nombre} {userItem.apellido}</p>
                <p className="text-xs text-gray-400">@{userItem.nick_telegram}</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Email</span>
                <span className="text-sm text-white truncate ml-2">{userItem.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">País</span>
                <span className="text-sm text-white">{userItem.pais}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Teléfono</span>
                <span className="text-sm text-white">{userItem.telefono}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Registro</span>
                <span className="text-sm text-white">
                  {new Date(userItem.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {subView === 'pending' && (
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => handleApproveUser(userItem.id)}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
                <button
                  onClick={() => handleRejectUserSubmit(userItem.id)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderUsersByExchange = () => {
    const exchanges = [
      { name: 'Binance', key: 'binance', users: usersByExchange.binance, color: 'from-yellow-600 to-amber-600' },
      { name: 'Blofin', key: 'blofin', users: usersByExchange.blofin, color: 'from-blue-600 to-cyan-600' },
      { name: 'Bybit', key: 'bybit', users: usersByExchange.bybit, color: 'from-orange-600 to-red-600' },
    ];

    return (
      <div className="space-y-8">
        {exchanges.map((exchange) => (
          <div key={exchange.key}>
            <div className={`flex items-center gap-3 mb-4 pb-3 border-b border-slate-700`}>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${exchange.color} flex items-center justify-center`}>
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{exchange.name}</h3>
                <p className="text-sm text-gray-400">{exchange.users.length} usuarios</p>
              </div>
            </div>

            {exchange.users.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-slate-800/30 rounded-xl">
                No hay usuarios en {exchange.name}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exchange.users.map((userItem) => (
                  <div
                    key={userItem.id}
                    className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-5 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {userItem.nombre[0]}{userItem.apellido[0]}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{userItem.nombre} {userItem.apellido}</p>
                        <p className="text-xs text-gray-400">@{userItem.nick_telegram}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-700 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Monto Invertido</span>
                        <span className="text-lg font-bold text-emerald-400">${userItem.capital_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPlans = () => {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleTogglePlansEnabled}
              className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
                plansEnabled
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:shadow-lg'
              }`}
            >
              <Settings className="w-5 h-5" />
              {plansEnabled ? 'Planes Habilitados' : 'Planes Deshabilitados'}
            </button>
            <p className="text-sm text-gray-400">
              {plansEnabled ? 'Los usuarios pueden seleccionar planes' : 'Selección de planes bloqueada'}
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPlan(null);
              setPlanForm({ name: '', description: '', price: '', duration_days: '', features: '', display_order: '0' });
              setShowPlanModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Crear Plan
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p>No hay planes creados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                    <p className="text-sm text-gray-400">{plan.description}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </div>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Precio</span>
                    <span className="text-lg font-bold text-cyan-400">${plan.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Duracion</span>
                    <span className="text-sm text-white">{plan.duration_days} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Orden</span>
                    <span className="text-sm text-white">{plan.display_order}</span>
                  </div>
                </div>

                {plan.features.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-xs text-gray-400 mb-2">Caracteristicas:</p>
                    <ul className="space-y-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleTogglePlanStatus(plan)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      plan.is_active
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {plan.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPlanRequests = () => {
    if (planRequests.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p>No hay solicitudes de cambio de plan pendientes</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planRequests.map((request) => (
          <div
            key={request.id}
            className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {request.user?.nombre[0]}{request.user?.apellido[0]}
                </div>
                <div>
                  <p className="font-semibold text-white">{request.user?.nombre} {request.user?.apellido}</p>
                  <p className="text-xs text-gray-400">@{request.user?.nick_telegram}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 space-y-3">
              {request.current_plan && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Plan Actual</p>
                  <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                    <p className="font-bold text-white">{request.current_plan.name}</p>
                    <p className="text-xs text-gray-400">${request.current_plan.price} - {request.current_plan.duration_days} dias</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1">Plan Solicitado</p>
                <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-700/50 rounded-lg p-3">
                  <p className="font-bold text-cyan-400">{request.requested_plan?.name}</p>
                  <p className="text-xs text-gray-300">${request.requested_plan?.price} - {request.requested_plan?.duration_days} dias</p>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                <span>Solicitado</span>
                <span>{new Date(request.requested_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => handleApprovePlanRequest(request.id)}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Aprobar
              </button>
              <button
                onClick={() => handleRejectPlanRequest(request.id)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </button>
            </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-cyan-500/20 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Panel Operador
          </h1>
          <p className="text-sm text-gray-400">{user.nombre} {user.apellido}</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => { setMainView('bot-activation'); loadData(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              mainView === 'bot-activation'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-slate-800/50'
            }`}
          >
            <Power className="w-5 h-5" />
            Activación Bot
          </button>

          <button
            onClick={() => { setMainView('user-approval'); setSubView('pending'); loadData(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              mainView === 'user-approval'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-slate-800/50'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Registros
          </button>

          <button
            onClick={() => { setMainView('users'); loadData(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              mainView === 'users'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-5 h-5" />
            Usuarios
          </button>

          <button
            onClick={() => { setMainView('plans'); loadData(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              mainView === 'plans'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Planes
          </button>

          <button
            onClick={() => { setMainView('plan-requests'); loadData(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              mainView === 'plan-requests'
                ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-slate-800/50'
            }`}
          >
            <RefreshCw className="w-5 h-5" />
            Solicitudes
            {planRequests.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {planRequests.length}
              </span>
            )}
          </button>
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-3 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-all mt-auto"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>

      <div className="relative z-10 flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">
            {mainView === 'bot-activation' ? 'Activación del Bot' : mainView === 'user-approval' ? 'Aprobación de Usuarios' : mainView === 'users' ? 'Usuarios por Exchange' : mainView === 'plans' ? 'Gestion de Planes' : 'Solicitudes de Cambio de Plan'}
          </h2>

          {mainView === 'user-approval' && (
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
          )}

          <div className={`${mainView === 'users' || mainView === 'plans' || mainView === 'plan-requests' ? '' : 'bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)]'}`}>
            {loading ? (
              <div className="text-center py-12 text-cyan-400">Cargando...</div>
            ) : (
              mainView === 'bot-activation' ? renderBotActivation() : mainView === 'user-approval' ? renderUserApproval() : mainView === 'users' ? renderUsersByExchange() : mainView === 'plans' ? renderPlans() : renderPlanRequests()
            )}
          </div>
        </div>
      </div>

      {showActivationModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              {selectedUser.is_active ? 'Desactivar' : 'Activar'} Bot
            </h3>
            <p className="text-gray-300 mb-4">
              Usuario: <span className="font-bold text-white">{selectedUser.nombre} {selectedUser.apellido}</span>
            </p>

            {!selectedUser.is_active && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Días de activación
                </label>
                <input
                  type="number"
                  value={activationDays}
                  onChange={(e) => setActivationDays(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="30"
                  min="1"
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowActivationModal(false);
                  setSelectedUser(null);
                  setActivationDays('30');
                }}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleBotActivation(!selectedUser.is_active)}
                className={`flex-1 py-2 text-white rounded-lg transition-colors ${
                  selectedUser.is_active
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedUser.is_active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              {editingPlan ? 'Editar Plan' : 'Crear Plan'}
            </h3>

            <form onSubmit={handleCreateOrUpdatePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Plan</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Ej: Plan Basico"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descripcion</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Descripcion del plan"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duracion en dias</label>
                  <input
                    type="number"
                    value={planForm.duration_days}
                    onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="30"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Orden de Visualizacion</label>
                <input
                  type="number"
                  value={planForm.display_order}
                  onChange={(e) => setPlanForm({ ...planForm, display_order: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Menor numero aparece primero</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Caracteristicas (una por linea)</label>
                <textarea
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Caracteristica 1&#10;Caracteristica 2&#10;Caracteristica 3"
                  rows={5}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanModal(false);
                    setEditingPlan(null);
                    setPlanForm({ name: '', description: '', price: '', duration_days: '', features: '', display_order: '0' });
                  }}
                  className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editingPlan ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
