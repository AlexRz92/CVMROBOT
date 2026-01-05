import { MessageCircle, Mail, Phone, HelpCircle, FileText, Clock } from 'lucide-react';

export default function SoporteView() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Centro de Soporte</h2>
            <p className="text-gray-400">Estamos aquí para ayudarte con cualquier consulta</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6 hover:border-cyan-500 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Chat en Vivo</h3>
            <p className="text-sm text-gray-400 mb-4">
              Chatea con nuestro equipo de soporte en tiempo real
            </p>
            <button className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
              Iniciar Chat
            </button>
          </div>

          <div className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6 hover:border-cyan-500 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Email</h3>
            <p className="text-sm text-gray-400 mb-4">
              Envíanos un correo y te responderemos pronto
            </p>
            <a
              href="mailto:soporte@cvmresearch.com"
              className="block w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-center"
            >
              Enviar Email
            </a>
          </div>

          <div className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6 hover:border-cyan-500 transition-all cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Teléfono</h3>
            <p className="text-sm text-gray-400 mb-4">
              Llámanos directamente para asistencia inmediata
            </p>
            <a
              href="tel:+1234567890"
              className="block w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
            >
              Llamar Ahora
            </a>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-cyan-400" />
          Preguntas Frecuentes
        </h3>

        <div className="space-y-4">
          {[
            {
              q: '¿Cómo conecto mi exchange?',
              a: 'Ve a la sección Bot y haz clic en "Conectar Exchange". Necesitarás proporcionar tus API Keys del exchange que deseas conectar.',
            },
            {
              q: '¿Cuánto tiempo tarda en aprobarse un depósito?',
              a: 'Los depósitos suelen aprobarse en 24-48 horas hábiles. Recibirás una notificación una vez aprobado.',
            },
            {
              q: '¿Es seguro usar el bot de trading?',
              a: 'Sí, nuestro bot utiliza conexiones seguras y encriptadas. Nunca almacenamos tus claves privadas y solo usamos permisos de trading sin retiros.',
            },
            {
              q: '¿Puedo pausar el bot en cualquier momento?',
              a: 'Absolutamente. Puedes activar o desactivar el bot cuando lo desees desde la sección Bot.',
            },
            {
              q: '¿Qué exchanges son compatibles?',
              a: 'Actualmente soportamos Binance, Blofin y Bybit. Estamos trabajando en agregar más exchanges.',
            },
          ].map((faq, i) => (
            <div key={i} className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-6">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-cyan-400">Q:</span>
                {faq.q}
              </h4>
              <p className="text-gray-400 text-sm pl-6">
                <span className="text-emerald-400">A:</span> {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-cyan-400" />
          Recursos Útiles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Guía de Inicio Rápido', desc: 'Aprende a configurar tu cuenta' },
            { title: 'Documentación API', desc: 'Integra con nuestros servicios' },
            { title: 'Video Tutoriales', desc: 'Tutoriales paso a paso' },
            { title: 'Términos de Servicio', desc: 'Lee nuestros términos' },
          ].map((resource, i) => (
            <div
              key={i}
              className="bg-blue-950/50 border border-blue-700/30 rounded-lg p-4 hover:border-cyan-500 transition-all cursor-pointer"
            >
              <h4 className="font-semibold text-white mb-1">{resource.title}</h4>
              <p className="text-sm text-gray-400">{resource.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-700/50 rounded-xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Horario de Atención</h3>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Lunes a Viernes: 9:00 AM - 6:00 PM (GMT-5)</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Respuestas por email en menos de 24 horas
            </p>
          </div>
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Clock className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
