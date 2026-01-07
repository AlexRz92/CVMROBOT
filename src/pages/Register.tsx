import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, MessageSquare, Lock, Shield, CheckCircle, Phone } from 'lucide-react';
import { supabase, SecretQuestion, register } from '../lib/supabase';
import { countries } from '../lib/countries';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

interface FieldErrors {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  nick_telegram?: string;
}

export default function Register({ onNavigate }: RegisterProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    pais: '',
    telefono: '',
    nick_telegram: '',
    email: '',
    pregunta_secreta_id: '',
    respuesta_secreta: '',
    password: '',
    confirmPassword: '',
  });

  const [phonePrefix, setPhonePrefix] = useState('');

  const [captcha, setCaptcha] = useState({ question: '', answer: 0 });
  const [captchaInput, setCaptchaInput] = useState('');
  const [secretQuestions, setSecretQuestions] = useState<SecretQuestion[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    fetchSecretQuestions();
    generateCaptcha();
  }, []);

  const fetchSecretQuestions = async () => {
    const { data, error } = await supabase
      .from('secret_questions')
      .select('*')
      .order('id');

    if (!error && data) {
      setSecretQuestions(data);
    }
  };

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ question: `${num1} + ${num2}`, answer: num1 + num2 });
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (!/[A-Z]/.test(password)) errors.push('Debe contener al menos una mayúscula');
    if (!/[0-9]/.test(password)) errors.push('Debe contener al menos un número');
    if (password.length < 8) errors.push('Debe tener al menos 8 caracteres');
    return errors;
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    setPasswordErrors(validatePassword(password));
  };

  const validateName = (value: string): string | undefined => {
    if (/\d/.test(value)) {
      return 'No puede contener números';
    }
    if (value.trim().length < 2) {
      return 'Debe tener al menos 2 caracteres';
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Correo electrónico inválido';
    }
    return undefined;
  };

  const validatePhone = (value: string): string | undefined => {
    const phoneRegex = /^\d{7,15}$/;
    if (!phoneRegex.test(value)) {
      return 'Debe contener entre 7 y 15 dígitos';
    }
    return undefined;
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setFormData({ ...formData, pais: country.name });
      setPhonePrefix(country.phoneCode);
    }
  };

  const handleNameChange = (value: string) => {
    setFormData({ ...formData, nombre: value });
    const error = validateName(value);
    setFieldErrors({ ...fieldErrors, nombre: error });
  };

  const handleLastNameChange = (value: string) => {
    setFormData({ ...formData, apellido: value });
    const error = validateName(value);
    setFieldErrors({ ...fieldErrors, apellido: error });
  };

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    const error = validateEmail(value);
    setFieldErrors({ ...fieldErrors, email: error });
  };

  const handlePhoneChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    setFormData({ ...formData, telefono: numbersOnly });
    const error = validatePhone(numbersOnly);
    setFieldErrors({ ...fieldErrors, telefono: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre || !formData.apellido || !formData.pais || !formData.telefono ||
        !formData.nick_telegram || !formData.email || !formData.pregunta_secreta_id ||
        !formData.respuesta_secreta || !formData.password || !formData.confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    const nameError = validateName(formData.nombre);
    const lastNameError = validateName(formData.apellido);
    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.telefono);

    if (nameError || lastNameError || emailError || phoneError) {
      setError('Por favor corrige los errores en los campos');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('La contraseña no cumple con los requisitos');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (parseInt(captchaInput) !== captcha.answer) {
      setError('El captcha es incorrecto');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    if (!acceptedTerms || !hasReadTerms) {
      setError('Debes leer y aceptar los términos y condiciones completamente');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellido: formData.apellido,
        pais: formData.pais,
        telefono: `${phonePrefix}${formData.telefono}`,
        nick_telegram: formData.nick_telegram,
        pregunta_secreta_id: parseInt(formData.pregunta_secreta_id),
        respuesta_secreta: formData.respuesta_secreta,
      });

      setRegistrationSuccess(true);
      setTimeout(() => {
        onNavigate('login');
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + 10) {
      setHasReadTerms(true);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-green-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)] text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Registro Exitoso</h2>
            <p className="text-gray-300 mb-6">
              Tu cuenta ha sido creada exitosamente. Sin embargo, debe ser aprobada por un operador antes de que puedas iniciar sesión.
            </p>
            <p className="text-cyan-400 font-medium mb-2">
              Recibirás una notificación una vez que tu cuenta sea aprobada.
            </p>
            <p className="text-sm text-gray-400 mt-6">
              Serás redirigido al inicio de sesión en unos segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 py-12">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10 w-full max-w-2xl">
        <button
          onClick={() => onNavigate('login')}
          className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Registro
          </h2>
          <p className="text-gray-400 text-center mb-8">Crea tu cuenta en CVM Research</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nombre *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border ${
                      fieldErrors.nombre ? 'border-red-500' : 'border-cyan-500/30'
                    } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm`}
                    placeholder="Solo letras"
                    required
                  />
                </div>
                {fieldErrors.nombre && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Apellido *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => handleLastNameChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border ${
                      fieldErrors.apellido ? 'border-red-500' : 'border-cyan-500/30'
                    } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm`}
                    placeholder="Solo letras"
                    required
                  />
                </div>
                {fieldErrors.apellido && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.apellido}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">País *</label>
              <select
                value={countries.find(c => c.name === formData.pais)?.code || ''}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                required
              >
                <option value="">Selecciona un país</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.phoneCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Número de Teléfono *</label>
                <div className="flex gap-2">
                  <div className="w-20 px-3 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm flex items-center justify-center font-medium">
                    {phonePrefix || '+00'}
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border ${
                        fieldErrors.telefono ? 'border-red-500' : 'border-cyan-500/30'
                      } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm`}
                      placeholder="Solo números"
                      required
                    />
                  </div>
                </div>
                {fieldErrors.telefono && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.telefono}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nick de Telegram *</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nick_telegram}
                    onChange={(e) => setFormData({ ...formData, nick_telegram: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                    placeholder="@usuario"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Correo Electrónico *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border ${
                    fieldErrors.email ? 'border-red-500' : 'border-cyan-500/30'
                  } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm`}
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pregunta Secreta *</label>
              <select
                value={formData.pregunta_secreta_id}
                onChange={(e) => setFormData({ ...formData, pregunta_secreta_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                required
              >
                <option value="">Selecciona una pregunta</option>
                {secretQuestions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.question}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Respuesta Secreta *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.respuesta_secreta}
                  onChange={(e) => setFormData({ ...formData, respuesta_secreta: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                  placeholder="Tu respuesta"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Captcha: ¿Cuánto es {captcha.question}? *
              </label>
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                placeholder="Escribe el resultado"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>
              {passwordErrors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {passwordErrors.map((err, idx) => (
                    <li key={idx} className="text-xs text-red-400 flex items-center gap-1">
                      <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                disabled={!hasReadTerms}
                className="mt-1 w-4 h-4 accent-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                >
                  términos y condiciones *
                </button>
                {!hasReadTerms && (
                  <span className="block text-xs text-yellow-400 mt-1">
                    Debes leer los términos completamente antes de aceptarlos
                  </span>
                )}
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || passwordErrors.length > 0}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
        </div>
      </div>

      {showTermsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-cyan-500/20">
              <h3 className="text-2xl font-bold text-cyan-400">Términos y Condiciones</h3>
            </div>

            <div
              onScroll={handleTermsScroll}
              className="p-6 overflow-y-auto max-h-[50vh] text-gray-300 text-sm space-y-4"
            >
              <h4 className="font-bold text-white">1. Aceptación de Términos</h4>
              <p>Al acceder y utilizar CVM Research, usted acepta estar sujeto a estos términos y condiciones de uso.</p>

              <h4 className="font-bold text-white">2. Uso de la Plataforma</h4>
              <p>Los usuarios se comprometen a utilizar la plataforma de manera responsable y de acuerdo con todas las leyes aplicables.</p>

              <h4 className="font-bold text-white">3. Privacidad y Datos</h4>
              <p>Toda la información personal será tratada de acuerdo con nuestra política de privacidad y las leyes de protección de datos vigentes.</p>

              <h4 className="font-bold text-white">4. Propiedad Intelectual</h4>
              <p>Todo el contenido de la plataforma es propiedad de CVM Research y está protegido por las leyes de propiedad intelectual.</p>

              <h4 className="font-bold text-white">5. Responsabilidad</h4>
              <p>CVM Research no se hace responsable por el uso indebido de la plataforma por parte de los usuarios.</p>

              <h4 className="font-bold text-white">6. Modificaciones</h4>
              <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigencia inmediatamente después de su publicación.</p>

              <h4 className="font-bold text-white">7. Terminación</h4>
              <p>Podemos suspender o terminar su acceso a la plataforma en cualquier momento si se violan estos términos.</p>

              <p className="pt-4 text-gray-400 italic">
                Debe leer todo el contenido para poder aceptar los términos y condiciones.
              </p>
            </div>

            <div className="p-6 border-t border-cyan-500/20 flex gap-4">
              <button
                onClick={() => setShowTermsModal(false)}
                className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  if (hasReadTerms) {
                    setAcceptedTerms(true);
                    setShowTermsModal(false);
                  }
                }}
                disabled={!hasReadTerms}
                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
