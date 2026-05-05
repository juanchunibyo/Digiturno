import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Megaphone, MonitorPlay, BellRing } from 'lucide-react';

export default function PantallaTurnos({ turnoActualInicial, enEsperaInicial, historialInicial }) {
    console.log("PantallaTurnos rendering...", { turnoActualInicial, enEsperaInicial, historialInicial });

    // --- MAPA DE COLORES ---
    const getTipoColor = (tipo) => {
        const t = tipo?.toLowerCase() || '';
        if (t.includes('víctima')) return { 
            bg: 'bg-orange-500', 
            text: 'text-orange-600', 
            border: 'border-orange-500', 
            light: 'bg-orange-50', 
            gradient: 'from-orange-500 to-red-600',
            glow: 'rgba(249, 115, 22, 0.5)'
        };
        if (t.includes('priorit')) return { 
            bg: 'bg-yellow-500', 
            text: 'text-yellow-700', 
            border: 'border-yellow-500', 
            light: 'bg-yellow-50', 
            gradient: 'from-yellow-500 to-amber-600',
            glow: 'rgba(234, 179, 8, 0.5)'
        };
        if (t.includes('empresa')) return { 
            bg: 'bg-blue-500', 
            text: 'text-blue-600', 
            border: 'border-blue-500', 
            light: 'bg-blue-50', 
            gradient: 'from-blue-500 to-cyan-600',
            glow: 'rgba(14, 165, 233, 0.5)'
        };
        return { 
            bg: 'bg-[#39A900]', 
            text: 'text-[#39A900]', 
            border: 'border-[#39A900]', 
            light: 'bg-green-50', 
            gradient: 'from-[#39A900] to-[#1B4332]',
            glow: 'rgba(57, 169, 0, 0.5)'
        };
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    const [turnoActual, setTurnoActual] = useState(turnoActualInicial);
    const [filaEspera, setFilaEspera] = useState(enEsperaInicial || []);
    const [isCalling, setIsCalling] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    // USAMOS UN VIDEO INSTITUCIONAL DE LA APE QUE SÍ PERMITE EMBED
    const videoId = "p7-9P_T4zN8"; 

    const activarAudio = async () => {
        console.log("Audio activado");
        setAudioEnabled(true);
    };

    const anunciarTurno = (turno, taquilla) => {
        if (!audioEnabled) return;
        
        // REPRODUCIR TIMBRE (CHIME)
        const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        chime.volume = 0.5;
        chime.play().then(() => {
            // ESPERAR UN MOMENTO Y HABLAR
            setTimeout(() => {
                if (!window.speechSynthesis) return;
                window.speechSynthesis.cancel();
                const turnoStr = String(turno || '');
                const ut = new SpeechSynthesisUtterance(`Turno ${turnoStr.split('').join(' ')}, pase a ${taquilla}.`);
                ut.lang = 'es-MX';
                ut.rate = 0.9;
                window.speechSynthesis.speak(ut);
            }, 1000);
        }).catch(e => console.error("Error chime:", e));
    };

    // Polling cada 2 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            fetch('/pantalla/turnos')
                .then(res => res.json())
                .then(data => {
                    const hasChanged = data.actual && (
                        data.actual.turno !== turnoActual?.turno || 
                        data.actual.updated_at !== turnoActual?.updated_at
                    );
                    
                    if (hasChanged) {
                        setTurnoActual(data.actual);
                        setIsCalling(true);
                        anunciarTurno(data.actual.turno, data.actual.taquilla);
                        setTimeout(() => setIsCalling(false), 8000);
                    } else if (!data.actual) {
                        setTurnoActual(null);
                    }
                    setFilaEspera(data.enEspera || []);
                })
                .catch(err => console.error("Error fetching turnos:", err));
        }, 2000);
        
        return () => clearInterval(interval);
    }, [turnoActual, audioEnabled]);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const currentColors = getTipoColor(turnoActual?.tipo);

    return (
        <div className="w-full h-screen bg-[#F0F4F1] text-[#0B3D2E] font-['Inter',sans-serif] overflow-hidden select-none flex flex-col relative">
            <Head>
                <title>Pantalla de Turnos | SENA APE</title>
                <style>{`* { scrollbar-width: none; -ms-overflow-style: none; } *::-webkit-scrollbar { display: none; }`}</style>
            </Head>

            {/* ACTIVACIÓN AUDIO - Más discreta */}
            <AnimatePresence>
                {!audioEnabled && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500] bg-[#0B3D2E]/95 backdrop-blur-md flex flex-col items-center justify-center text-white p-10 text-center">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ repeat: Infinity, duration: 2, repeatType: 'reverse' }} className="mb-12 bg-white/10 p-10 rounded-full">
                            <Megaphone size={120} className="text-[#39A900]" />
                        </motion.div>
                        <h2 className="text-6xl font-black mb-6 tracking-tighter">SISTEMA LISTO</h2>
                        <p className="text-xl text-white/60 mb-12 max-w-lg font-medium">Haga clic en el botón para activar los anuncios de voz y el video institucional de la APE.</p>
                        <motion.button 
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={activarAudio} 
                            className="bg-[#39A900] text-white px-20 py-8 rounded-full font-black text-3xl shadow-2xl border-4 border-white/20 flex items-center gap-6"
                        >
                            INICIAR PANTALLA
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OVERLAY LLAMANDO */}
            <AnimatePresence>
                {isCalling && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[400] flex items-center justify-center bg-[#0a1a14]/95 backdrop-blur-[20px] p-10 overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[80%] h-[80%] rounded-full opacity-20 blur-[150px]" style={{ backgroundColor: currentColors.glow }}></div>
                        </div>
                        <motion.div initial={{ scale: 0.8, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ type: "spring", damping: 15, stiffness: 100 }} className="relative flex flex-col items-center justify-center max-w-full">
                            <motion.div initial={{ y: 20 }} animate={{ y: -20 }} transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }} className="mb-8 flex items-center gap-4">
                                <div className={`p-5 rounded-full ${currentColors.bg} text-white shadow-2xl`}><BellRing size={60} className="animate-pulse" /></div>
                                <span className="text-white text-4xl font-black uppercase tracking-[0.4em] drop-shadow-lg">Llamado de Turno</span>
                            </motion.div>
                            <div className="relative">
                                <h1 className={`text-[25vw] font-black leading-none tracking-tighter ${currentColors.text} drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]`}>{turnoActual?.turno}</h1>
                                <div className="absolute inset-0 -z-10 blur-[80px] opacity-30 bg-white"></div>
                            </div>
                            <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-10 mt-10">
                                <div className="h-2 w-40 rounded-full bg-white/10" />
                                <div className={`px-24 py-12 rounded-[5rem] ${currentColors.bg} border-4 border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.4)]`}>
                                    <p className="text-white text-[10vw] font-black leading-none uppercase tracking-tighter drop-shadow-md">{turnoActual?.taquilla}</p>
                                </div>
                                <div className="h-2 w-40 rounded-full bg-white/10" />
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-1 overflow-hidden p-[2vh] gap-[3vh] flex-row-reverse">
                <div className="flex-[7] flex flex-col gap-[2vh]">
                    <div className="flex-[6] bg-black rounded-[4rem] overflow-hidden relative shadow-2xl border-4 border-white/10">
                        {audioEnabled ? (
                            <iframe 
                                className="w-full h-full object-cover opacity-80"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`}
                                title="SENA APE Video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                                <MonitorPlay size={100} />
                                <p className="mt-4 font-black uppercase tracking-widest">Iniciando sistema...</p>
                            </div>
                        )}
                        <div className="absolute top-10 left-10 flex items-center gap-4 bg-red-600 px-8 py-3 rounded-2xl border-2 border-white/20 z-10">
                            <div className="w-4 h-4 bg-white rounded-full animate-ping" />
                            <span className="text-white font-black uppercase tracking-widest text-[1.4vh]">SENA APE TV</span>
                        </div>
                    </div>

                    <div className={`flex-[4] bg-white rounded-[4rem] p-[5vh] flex items-center shadow-2xl border-4 ${currentColors.border} overflow-hidden transition-all duration-500`}>
                        <div className="flex-1">
                            <span className={`${currentColors.text} font-black uppercase tracking-[0.4em] text-[1.8vh] block mb-6`}>Turno Actual • {turnoActual?.tipo}</span>
                            <h1 className={`text-[19vh] font-black leading-none ${currentColors.text} drop-shadow-sm`}>{turnoActual?.turno}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-[#0B3D2E]/30 font-black uppercase tracking-[0.3em] text-[2.2vh] mb-6">Módulo de Atención</p>
                            <div className={`${currentColors.bg} text-white px-[5vw] py-[3vh] rounded-[3rem] shadow-2xl border-4 border-white/20 inline-block`}>
                                <span className="font-black text-[11vh] leading-none uppercase tracking-tighter">{turnoActual?.taquilla}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-[3] flex flex-col overflow-hidden">
                    <div className="h-full bg-white rounded-[4rem] border-4 border-gray-100 flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-[4vh] bg-[#0B3D2E] text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Users size={32} className="text-[#39A900]" />
                                <h2 className="text-[2.4vh] font-black uppercase tracking-[0.2em]">En Espera</h2>
                            </div>
                        </div>
                        <div className="flex-1 p-[3vh] flex flex-col gap-[2vh] overflow-y-auto">
                            <AnimatePresence mode="popLayout">
                                {filaEspera.map((item) => {
                                    const colors = getTipoColor(item.tipo);
                                    return (
                                        <motion.div key={item.turno} layout initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }} 
                                            className={`p-[3.5vh] rounded-[2.5rem] border-2 ${colors.border}/10 ${colors.light} flex justify-between items-center shadow-sm`}>
                                            <span className={`text-[4.5vh] font-black ${colors.text}`}>{item.turno}</span>
                                            <span className={`text-[1.2vh] font-black px-4 py-2 rounded-xl bg-white border ${colors.border}/20 ${colors.text} uppercase tracking-widest shadow-sm`}>{item.tipo}</span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[8vh] bg-black flex items-center overflow-hidden border-t-4 border-[#39A900]">
                <div className="bg-[#39A900] h-full px-16 flex items-center z-10 shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
                    <img src="/logo-ape.png" alt="SENA" className="h-8 brightness-0 invert" />
                </div>
                <div className="flex-1 relative flex items-center overflow-hidden">
                    <motion.p animate={{ x: ['100%', '-100%'] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="whitespace-nowrap text-[2.4vh] font-medium uppercase text-white tracking-[0.1em]">
                        La Agencia Pública de Empleo del SENA informa que todos sus servicios son gratuitos, públicos y no requieren intermediarios | Recuerde consultar las vacantes vigentes a través de nuestro portal oficial: ape.sena.edu.co | SENA: Conocimiento y emprendimiento para todos los colombianos.
                    </motion.p>
                </div>
            </div>
        </div>
    );
}
