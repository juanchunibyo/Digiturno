import React, { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

export default function TurnoGenerado({ turno_numero, tipo, hora, fecha, documento }) {
    const tipoConfig = {
        'General':     { color: '#4B5563', label: 'Atención General'     },
        'Prioritaria': { color: '#EA580C', label: 'Atención Prioritaria' },
        'Víctimas':    { color: '#7C3AED', label: 'Atención Víctimas'    },
        'Empresa':     { color: '#1D4ED8', label: 'Empresa'              },
    };
    const cfg = tipoConfig[tipo] || tipoConfig['General'];

    // Auto-redirigir al inicio después de 30 segundos
    useEffect(() => {
        const t = setTimeout(() => { window.location.href = '/'; }, 30000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="relative min-h-screen flex flex-col font-['Inter',sans-serif] select-none overflow-hidden bg-[#1B4332]">
            <Head title="Turno Generado | SENA APE" />

            {/* Fondo */}
            <div className="absolute inset-0 z-0">
                <img alt="Fondo SENA" className="w-full h-full object-cover" src="/ape-bg.png" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-[#1B4332]/80 to-black/70 backdrop-blur-[4px]" />
            </div>

            {/* Header */}
            <header className="relative w-full flex justify-between items-center px-10 py-6 z-20">
                <div className="flex items-center bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
                    <img src="/logo-ape.png" alt="SENA APE" className="h-[46px] object-contain brightness-0 invert" />
                </div>
                <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                    <span className="text-[#5ceb00] text-xs font-black uppercase tracking-widest">Turno Generado Exitosamente</span>
                </div>
            </header>

            {/* Contenido */}
            <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                    className="w-full max-w-2xl bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Franja superior verde */}
                    <div className="bg-[#39A900] py-8 flex flex-col items-center gap-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                        >
                            <CheckCircle2 size={64} className="text-white drop-shadow-lg" />
                        </motion.div>
                        <h1 className="text-white font-black text-2xl uppercase tracking-widest">¡Turno Generado!</h1>
                        <p className="text-white/80 text-sm font-medium">Su turno ha sido registrado exitosamente</p>
                    </div>

                    {/* Número de turno */}
                    <div className="flex flex-col items-center py-12 px-10 gap-6">
                        <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-sm">Su número de turno es</p>

                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.3 }}
                            className="font-black text-white tracking-tighter leading-none"
                            style={{ fontSize: '10rem' }}
                        >
                            {turno_numero}
                        </motion.div>

                        {/* Badge tipo */}
                        <span
                            className="text-white font-black uppercase tracking-widest text-sm px-6 py-2 rounded-full"
                            style={{ background: cfg.color }}
                        >
                            {cfg.label}
                        </span>

                        {/* Info */}
                        <div className="w-full grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
                                <span className="text-gray-500 text-xs font-black uppercase tracking-widest">Documento</span>
                                <span className="text-white font-black text-xl font-mono">{documento}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
                                <span className="text-gray-500 text-xs font-black uppercase tracking-widest">Hora de registro</span>
                                <span className="text-white font-black text-xl">{hora}</span>
                            </div>
                        </div>

                        {/* Instrucción */}
                        <div className="w-full bg-[#39A900]/10 border border-[#39A900]/30 rounded-2xl p-5 text-center mt-2">
                            <p className="text-[#5ceb00] font-bold text-base leading-relaxed">
                                Por favor espere en sala. Cuando su turno sea llamado en la pantalla, diríjase al módulo indicado.
                            </p>
                        </div>

                        {/* Contador regreso */}
                        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mt-2">
                            Esta pantalla se reiniciará automáticamente en 30 segundos
                        </p>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <div className="relative z-20 p-6 bg-black/40 backdrop-blur-xl border-t border-white/10">
                <div className="max-w-2xl mx-auto">
                    <Link
                        href="/"
                        className="w-full py-5 px-10 bg-white/5 text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-4 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                    >
                        <ArrowLeft size={26} className="text-gray-400" />
                        Volver al Inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
