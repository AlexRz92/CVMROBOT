import { Sparkles } from 'lucide-react';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export default function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="absolute top-6 left-6 z-20">
        <div className="w-48 h-48  from-cyan-500/20 to-blue-500/10   shadow-cyan-500/30 p-2 transition-all duration-300">
          <img
            src="/port.png"
            alt="Hidden Port"
            className="w-full h-full object-contain animate-glow-pulse"
          />
        </div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Sparkles className="w-16 h-16 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 bg-cyan-400 blur-2xl opacity-50"></div>
          </div>
        </div>

        <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-300 to-yellow-400 bg-clip-text text-transparent tracking-tight">
          CVM Research
        </h1>

        <div className="h-1 w-64 mx-auto mb-8 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

        <p className="text-xl md:text-2xl text-gray-300 mb-12 font-light">
          Plataforma de Investigación Avanzada
        </p>

        <button
          onClick={() => onNavigate('login')}
          className="group relative px-12 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-lg font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative flex items-center gap-2">
            Iniciar Sesión
            <Sparkles className="w-5 h-5" />
          </span>
        </button>

        <div className="mt-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-cyan-500/30 blur-3xl rounded-2xl"></div>
          <div className="relative bg-slate-800/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 shadow-[0_0_60px_rgba(34,211,238,0.2)]">
            <img
              src="/inicio.png"
              alt="CVM Research"
              className="w-full h-auto object-cover rounded-xl animate-glow-pulse"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
