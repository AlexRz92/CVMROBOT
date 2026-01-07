import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  pais: string;
  telefono: string;
  nick_telegram: string;
  pregunta_secreta_id: number;
  respuesta_secreta: string;
  is_temporary_password: boolean;
  is_operator: boolean;
  password_changed_at: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  expires_at: string;
}

export interface SecretQuestion {
  id: number;
  question: string;
}

const SESSION_KEY = 'cvm_session_token';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function hashSecretAnswer(answer: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(answer.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifySecretAnswer(answer: string, hashedAnswer: string): Promise<boolean> {
  const hashedInput = await hashSecretAnswer(answer);
  return hashedInput === hashedAnswer;
}

export function saveSessionToken(token: string): void {
  sessionStorage.setItem(SESSION_KEY, token);
}

export function getSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function clearSessionToken(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getSessionToken();
  if (!token) return null;

  try {
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', token)
      .maybeSingle();

    if (sessionError || !session) {
      clearSessionToken();
      return null;
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user_id)
      .maybeSingle();

    if (userError || !user) {
      clearSessionToken();
      return null;
    }

    return user;
  } catch (error) {
    clearSessionToken();
    return null;
  }
}

export async function login(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const passwordHash = await hashPassword(password);

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', passwordHash)
      .maybeSingle();

    if (userError || !user) {
      return null;
    }

    const token = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        token,
        expires_at: new Date().toISOString(),
      });

    if (sessionError) {
      throw sessionError;
    }

    saveSessionToken(token);
    return { user, token };
  } catch (error) {
    return null;
  }
}

export async function register(userData: {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  pais: string;
  telefono: string;
  nick_telegram: string;
  pregunta_secreta_id: number;
  respuesta_secreta: string;
}): Promise<User | null> {
  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado');
    }

    const passwordHash = await hashPassword(userData.password);
    const secretAnswerHash = await hashSecretAnswer(userData.respuesta_secreta);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        password_hash: passwordHash,
        nombre: userData.nombre,
        apellido: userData.apellido,
        pais: userData.pais,
        telefono: userData.telefono,
        nick_telegram: userData.nick_telegram,
        pregunta_secreta_id: userData.pregunta_secreta_id,
        respuesta_secreta: secretAnswerHash,
      })
      .select()
      .single();

    if (insertError || !newUser) {
      throw insertError || new Error('Error al crear el usuario');
    }

    return newUser;
  } catch (error) {
    throw error;
  }
}

export async function logout(): Promise<void> {
  const token = getSessionToken();
  if (token) {
    await supabase.from('sessions').delete().eq('token', token);
    clearSessionToken();
  }
}

export async function changePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(newPassword);

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        is_temporary_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return !error;
  } catch (error) {
    return false;
  }
}

export async function getBotStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_bot_status')
      .select('is_active')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return false;
    return data.is_active;
  } catch (error) {
    return false;
  }
}

export async function getExchangeStatus(userId: string, exchange: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_exchange_status')
      .select('is_active')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .maybeSingle();

    if (error || !data) return false;
    return data.is_active;
  } catch (error) {
    return false;
  }
}

export async function getAllExchangeStatuses(userId: string): Promise<Record<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from('user_exchange_status')
      .select('exchange, is_active')
      .eq('user_id', userId);

    if (error || !data) {
      return { binance: false, blofin: false, bybit: false };
    }

    const statuses: Record<string, boolean> = {
      binance: false,
      blofin: false,
      bybit: false,
    };

    data.forEach((row: any) => {
      statuses[row.exchange] = row.is_active;
    });

    return statuses;
  } catch (error) {
    return { binance: false, blofin: false, bybit: false };
  }
}

export async function updateBotStatus(userId: string, isActive: boolean): Promise<boolean> {
  try {
    const { error: selectError, data: existing } = await supabase
      .from('user_bot_status')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_bot_status')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      return !error;
    } else {
      const { error } = await supabase
        .from('user_bot_status')
        .insert({
          user_id: userId,
          is_active: isActive,
        });
      return !error;
    }
  } catch (error) {
    return false;
  }
}

export async function updateExchangeStatus(userId: string, exchange: string, isActive: boolean): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('user_exchange_status')
      .select('id')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('user_exchange_status')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('exchange', exchange);
      return !error;
    } else {
      const { error } = await supabase
        .from('user_exchange_status')
        .insert({
          user_id: userId,
          exchange,
          is_active: isActive,
        });
      return !error;
    }
  } catch (error) {
    return false;
  }
}

export interface Deposit {
  id: string;
  user_id: string;
  exchange: 'binance' | 'blofin' | 'bybit';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  user?: {
    nombre: string;
    apellido: string;
    nick_telegram: string;
  };
}

export interface Withdrawal {
  id: string;
  user_id: string;
  exchange: 'binance' | 'blofin' | 'bybit';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  user?: {
    nombre: string;
    apellido: string;
    nick_telegram: string;
  };
}

export interface UserBalance {
  id: string;
  user_id: string;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  updated_at: string;
}

export async function createDeposit(userId: string, exchange: string, amount: number): Promise<Deposit | null> {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .insert({
        user_id: userId,
        exchange,
        amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Error al crear el depósito');
    }

    return data;
  } catch (error) {
    return null;
  }
}

export async function createWithdrawal(userId: string, exchange: string, amount: number): Promise<Withdrawal | null> {
  try {
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .eq('status', 'approved');

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', userId)
      .eq('exchange', exchange)
      .eq('status', 'approved');

    const totalDeposits = deposits?.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0) || 0;
    const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0) || 0;
    const availableBalance = totalDeposits - totalWithdrawals;

    if (availableBalance < amount) {
      throw new Error('Saldo insuficiente en este exchange');
    }

    const { data, error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        exchange,
        amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Error al crear el retiro');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export async function getUserBalance(userId: string): Promise<UserBalance | null> {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    if (!data) {
      return {
        id: '',
        user_id: userId,
        balance: 0,
        total_deposited: 0,
        total_withdrawn: 0,
        updated_at: new Date().toISOString(),
      };
    }

    return data;
  } catch (error) {
    return null;
  }
}

export async function getUserDeposits(userId: string): Promise<Deposit[]> {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (error) {
    return [];
  }
}

export async function getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (error) {
    return [];
  }
}

export async function getPendingDeposits(): Promise<Deposit[]> {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending deposits:', error);
      return [];
    }

    if (!data) {
      console.warn('No data returned from pending deposits query');
      return [];
    }

    const userIds = [...new Set(data.map(d => d.user_id))];

    const { data: usersData } = await supabase
      .from('users')
      .select('id, nombre, apellido, nick_telegram')
      .in('id', userIds);

    const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

    console.log('Pending deposits fetched:', data.length, 'items');

    return data.map((item: any) => ({
      ...item,
      user: usersMap.get(item.user_id) ? {
        nombre: usersMap.get(item.user_id).nombre,
        apellido: usersMap.get(item.user_id).apellido,
        nick_telegram: usersMap.get(item.user_id).nick_telegram,
      } : undefined,
    }));
  } catch (error) {
    console.error('Exception in getPendingDeposits:', error);
    return [];
  }
}

export async function getPendingWithdrawals(): Promise<Withdrawal[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending withdrawals:', error);
      return [];
    }

    if (!data) {
      console.warn('No data returned from pending withdrawals query');
      return [];
    }

    const userIds = [...new Set(data.map(d => d.user_id))];

    const { data: usersData } = await supabase
      .from('users')
      .select('id, nombre, apellido, nick_telegram')
      .in('id', userIds);

    const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

    console.log('Pending withdrawals fetched:', data.length, 'items');

    return data.map((item: any) => ({
      ...item,
      user: usersMap.get(item.user_id) ? {
        nombre: usersMap.get(item.user_id).nombre,
        apellido: usersMap.get(item.user_id).apellido,
        nick_telegram: usersMap.get(item.user_id).nick_telegram,
      } : undefined,
    }));
  } catch (error) {
    console.error('Exception in getPendingWithdrawals:', error);
    return [];
  }
}

export async function approveDeposit(depositId: string, operatorId: string): Promise<boolean> {
  try {
    const { data: deposit, error: depositError } = await supabase
      .from('deposits')
      .select('user_id, exchange')
      .eq('id', depositId)
      .single();

    if (depositError || !deposit) {
      return false;
    }

    const { error } = await supabase
      .from('deposits')
      .update({
        status: 'approved',
        approved_by: operatorId,
      })
      .eq('id', depositId);

    if (error) {
      return false;
    }

    await updateExchangeStatus(deposit.user_id, deposit.exchange, true);

    return true;
  } catch (error) {
    return false;
  }
}

export async function rejectDeposit(depositId: string, operatorId: string, reason: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('deposits')
      .update({
        status: 'rejected',
        approved_by: operatorId,
        rejection_reason: reason,
      })
      .eq('id', depositId);

    return !error;
  } catch (error) {
    return false;
  }
}

export async function approveWithdrawal(withdrawalId: string, operatorId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        approved_by: operatorId,
      })
      .eq('id', withdrawalId);

    return !error;
  } catch (error) {
    return false;
  }
}

export async function rejectWithdrawal(withdrawalId: string, operatorId: string, reason: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        approved_by: operatorId,
        rejection_reason: reason,
      })
      .eq('id', withdrawalId);

    return !error;
  } catch (error) {
    return false;
  }
}

export async function getApprovedDeposits(): Promise<Deposit[]> {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    const userIds = [...new Set(data.map(d => d.user_id))];

    const { data: usersData } = await supabase
      .from('users')
      .select('id, nombre, apellido, nick_telegram')
      .in('id', userIds);

    const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

    return data.map((item: any) => ({
      ...item,
      user: usersMap.get(item.user_id) ? {
        nombre: usersMap.get(item.user_id).nombre,
        apellido: usersMap.get(item.user_id).apellido,
        nick_telegram: usersMap.get(item.user_id).nick_telegram,
      } : undefined,
    }));
  } catch (error) {
    return [];
  }
}

export async function getRejectedDeposits(): Promise<Deposit[]> {
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('status', 'rejected')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    const userIds = [...new Set(data.map(d => d.user_id))];

    const { data: usersData } = await supabase
      .from('users')
      .select('id, nombre, apellido, nick_telegram')
      .in('id', userIds);

    const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

    return data.map((item: any) => ({
      ...item,
      user: usersMap.get(item.user_id) ? {
        nombre: usersMap.get(item.user_id).nombre,
        apellido: usersMap.get(item.user_id).apellido,
        nick_telegram: usersMap.get(item.user_id).nick_telegram,
      } : undefined,
    }));
  } catch (error) {
    return [];
  }
}

export async function getApprovedWithdrawals(): Promise<Withdrawal[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    const userIds = [...new Set(data.map(d => d.user_id))];

    const { data: usersData } = await supabase
      .from('users')
      .select('id, nombre, apellido, nick_telegram')
      .in('id', userIds);

    const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

    return data.map((item: any) => ({
      ...item,
      user: usersMap.get(item.user_id) ? {
        nombre: usersMap.get(item.user_id).nombre,
        apellido: usersMap.get(item.user_id).apellido,
        nick_telegram: usersMap.get(item.user_id).nick_telegram,
      } : undefined,
    }));
  } catch (error) {
    return [];
  }
}

export async function getRejectedWithdrawals(): Promise<Withdrawal[]> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('status', 'rejected')
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    const userIds = [...new Set(data.map(d => d.user_id))];

    const { data: usersData } = await supabase
      .from('users')
      .select('id, nombre, apellido, nick_telegram')
      .in('id', userIds);

    const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

    return data.map((item: any) => ({
      ...item,
      user: usersMap.get(item.user_id) ? {
        nombre: usersMap.get(item.user_id).nombre,
        apellido: usersMap.get(item.user_id).apellido,
        nick_telegram: usersMap.get(item.user_id).nick_telegram,
      } : undefined,
    }));
  } catch (error) {
    return [];
  }
}

export interface BotEarning {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

export interface BotActivation {
  id: string;
  user_id: string;
  is_active: boolean;
  activated_at: string | null;
  days_remaining: number;
  updated_at: string;
}

export async function getUserEarnings(userId: string): Promise<BotEarning[]> {
  try {
    const { data, error } = await supabase
      .from('bot_earnings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (error) {
    return [];
  }
}

export async function getTotalEarnings(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('bot_earnings')
      .select('amount')
      .eq('user_id', userId);

    if (error || !data) {
      return 0;
    }

    return data.reduce((sum, earning) => sum + parseFloat(earning.amount.toString()), 0);
  } catch (error) {
    return 0;
  }
}

export async function getCalculatedBalance(userId: string): Promise<number> {
  try {
    const [deposits, withdrawals, earnings] = await Promise.all([
      getUserDeposits(userId),
      getUserWithdrawals(userId),
      getTotalEarnings(userId),
    ]);

    const totalDeposits = deposits
      .filter(d => d.status === 'approved')
      .reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);

    const totalWithdrawals = withdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0);

    return totalDeposits + earnings - totalWithdrawals;
  } catch (error) {
    return 0;
  }
}

export async function getBotActivation(userId: string): Promise<BotActivation | null> {
  try {
    const { data, error } = await supabase
      .from('bot_activation')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return {
        id: '',
        user_id: userId,
        is_active: false,
        activated_at: null,
        days_remaining: 0,
        updated_at: new Date().toISOString(),
      };
    }

    return data;
  } catch (error) {
    return null;
  }
}

export async function updateBotActivation(userId: string, isActive: boolean, daysRemaining?: number): Promise<boolean> {
  try {
    console.log('updateBotActivation called:', { userId, isActive, daysRemaining });

    const { data: existing } = await supabase
      .from('bot_activation')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const updateData: any = {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (isActive) {
      updateData.activated_at = new Date().toISOString();
      if (daysRemaining !== undefined) {
        updateData.days_remaining = daysRemaining;
      }
    } else {
      updateData.days_remaining = 0;
    }

    if (existing) {
      console.log('Updating existing bot_activation:', updateData);
      const { error } = await supabase
        .from('bot_activation')
        .update(updateData)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating bot_activation:', error);
        return false;
      }
      console.log('Bot activation updated successfully');
      return true;
    } else {
      console.log('Inserting new bot_activation:', updateData);
      const { error } = await supabase
        .from('bot_activation')
        .insert({
          user_id: userId,
          ...updateData,
        });

      if (error) {
        console.error('Error inserting bot_activation:', error);
        return false;
      }
      console.log('Bot activation inserted successfully');
      return true;
    }
  } catch (error) {
    console.error('Exception in updateBotActivation:', error);
    return false;
  }
}

export interface UserWithActivation {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  nick_telegram: string;
  is_active: boolean;
  days_remaining: number;
  activated_at: string | null;
}

export async function getAllUsersWithActivation(): Promise<UserWithActivation[]> {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, nick_telegram')
      .eq('is_operator', false)
      .order('created_at', { ascending: false });

    if (usersError || !users) {
      return [];
    }

    const userActivations = await Promise.all(
      users.map(async (user) => {
        const activation = await getBotActivation(user.id);
        return {
          ...user,
          is_active: activation?.is_active || false,
          days_remaining: activation?.days_remaining || 0,
          activated_at: activation?.activated_at || null,
        };
      })
    );

    return userActivations;
  } catch (error) {
    return [];
  }
}

export async function deleteDeposit(depositId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('deposits')
      .delete()
      .eq('id', depositId)
      .eq('status', 'pending');

    return !error;
  } catch (error) {
    return false;
  }
}

export async function deleteWithdrawal(withdrawalId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('withdrawals')
      .delete()
      .eq('id', withdrawalId)
      .eq('status', 'pending');

    return !error;
  } catch (error) {
    return false;
  }
}
