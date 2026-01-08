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
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_date?: string;
  approved_by?: string;
  rejection_reason?: string;
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

export interface UserCapital {
  id: string;
  user_id: string;
  exchange: 'binance' | 'blofin' | 'bybit';
  capital_amount: number;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
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

export async function login(email: string, password: string): Promise<{ user: User; token: string; error?: string } | null> {
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

    if (user.approval_status === 'rejected') {
      return { user, token: '', error: 'rejected' };
    }

    if (user.approval_status === 'pending') {
      return { user, token: '', error: 'pending' };
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

export async function getUserCapital(userId: string): Promise<UserCapital | null> {
  try {
    const { data, error } = await supabase
      .from('user_capital')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

export async function investCapital(userId: string, exchange: string, amount: number): Promise<boolean> {
  try {
    const { data: existingCapital } = await supabase
      .from('user_capital')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingCapital) {
      throw new Error('Ya tienes capital invertido en un exchange. Retira antes de cambiar.');
    }

    const { error } = await supabase
      .from('user_capital')
      .insert({
        user_id: userId,
        exchange,
        capital_amount: amount,
        is_connected: true,
      });

    return !error;
  } catch (error) {
    return false;
  }
}

export async function withdrawCapital(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_capital')
      .delete()
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    return false;
  }
}

export async function getExchangeStatus(userId: string): Promise<{ exchange: string; isConnected: boolean } | null> {
  try {
    const capital = await getUserCapital(userId);

    if (!capital) {
      return null;
    }

    return {
      exchange: capital.exchange,
      isConnected: capital.is_connected,
    };
  } catch (error) {
    return null;
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
    const [capital, earnings] = await Promise.all([
      getUserCapital(userId),
      getTotalEarnings(userId),
    ]);

    const capitalAmount = capital?.capital_amount || 0;

    return parseFloat(capitalAmount.toString()) + earnings;
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
      const { error } = await supabase
        .from('bot_activation')
        .update(updateData)
        .eq('user_id', userId);

      return !error;
    } else {
      const { error } = await supabase
        .from('bot_activation')
        .insert({
          user_id: userId,
          ...updateData,
        });

      return !error;
    }
  } catch (error) {
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
      .eq('approval_status', 'approved')
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

export interface PendingUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  pais: string;
  telefono: string;
  nick_telegram: string;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

export async function getPendingUsers(): Promise<PendingUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, pais, telefono, nick_telegram, created_at, approval_status')
      .eq('approval_status', 'pending')
      .eq('is_operator', false)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (error) {
    return [];
  }
}

export async function getApprovedUsers(): Promise<PendingUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, pais, telefono, nick_telegram, created_at, approval_status')
      .eq('approval_status', 'approved')
      .eq('is_operator', false)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (error) {
    return [];
  }
}

export async function getRejectedUsers(): Promise<PendingUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nombre, apellido, pais, telefono, nick_telegram, created_at, approval_status')
      .eq('approval_status', 'rejected')
      .eq('is_operator', false)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  } catch (error) {
    return [];
  }
}

export async function approveUser(userId: string, operatorId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        approval_status: 'approved',
        approval_date: new Date().toISOString(),
        approved_by: operatorId,
      })
      .eq('id', userId);

    return !error;
  } catch (error) {
    return false;
  }
}

export async function rejectUser(userId: string, operatorId: string, reason: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        approval_status: 'rejected',
        approval_date: new Date().toISOString(),
        approved_by: operatorId,
        rejection_reason: reason,
      })
      .eq('id', userId);

    return !error;
  } catch (error) {
    return false;
  }
}
