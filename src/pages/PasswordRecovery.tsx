import { useState } from 'react';
import { ArrowLeft, Mail, Shield, CheckCircle } from 'lucide-react';
import { supabase, verifySecretAnswer, hashPassword } from '../lib/supabase';

interface PasswordRecoveryProps {
  onNavigate: (page: string) => void;
}

export default function PasswordRecovery({ onNavigate }: PasswordRecoveryProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');
  const [userData, setUserData] = useState<{ id: string; respuesta_secreta: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, pregunta_secreta_id, respuesta_secreta')
        .eq('email', email)
        .maybeSingle();

      if (userError) throw userError;

      if (!user) {
        throw new Error('El correo no está registrado');
      }

      const { data: question, error: questionError } = await supabase
        .from('secret_questions')
        .select('question')
        .eq('id', user.pregunta_secreta_id)
        .single();

      if (questionError) throw questionError;

      if (!question) {
        throw new Error('Pregunta secreta no encontrada');
      }

      setSecretQuestion(question.question);
      setUserData({ id: user.id, respuesta_secreta: user.respuesta_secreta });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar el correo');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!userData) {
        throw new Error('Datos del usuario no encontrados');
      }

      const isValid = await verifySecretAnswer(secretAnswer, userData.respuesta_secreta);

      if (!isValid) {
        throw new Error('La respuesta secreta es incorrecta');
      }

      const newPasswordHash = await hashPassword('CVMBOT');

      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: newPasswordHash,
          is_temporary_password: true,
          password_changed_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (updateError) {
        throw new Error('No se pudo restablecer la contraseña. Por favor, contacta con soporte.');
      }

      setSuccess(true);
      setTimeout(() => onNavigate('login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar la respuesta');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)] text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Contraseña Restablecida</h2>
            <p className="text-gray-300 mb-4">
              Tu contraseña temporal es: <span className="font-bold text-cyan-400">CVMBOT</span>
            </p>
            <p className="text-sm text-gray-400">Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={() => onNavigate('login')}
          className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Recuperar Contraseña
          </h2>
          <p className="text-gray-400 text-center mb-8">
            {step === 1 ? 'Ingresa tu correo electrónico' : 'Responde tu pregunta secreta'}
          </p>

          {step === 1 ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAnswerSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pregunta Secreta
                </label>
                <div className="p-4 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-cyan-400">
                  {secretQuestion}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Respuesta Secreta
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={secretAnswer}
                    onChange={(e) => setSecretAnswer(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    placeholder="Tu respuesta"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Restablecer Contraseña'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setSecretAnswer('');
                }}
                className="w-full text-sm text-gray-400 hover:text-cyan-400 transition-colors"
              >
                Volver al paso anterior
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
