import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Megaphone, MonitorPlay, BellRing } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

export default function PantallaTurnos({ turnoActualInicial, enEsperaInicial, historialInicial }) {
    // --- REFS PARA GSAP ---
    const callingOverlayRef = useRef(null);
    const callingTitleRef = useRef(null);
    const turnoNumberRef = useRef(null);
    const taquillaBoxRef = useRef(null);
    const glowRef = useRef(null);
    const listItemsRef = useRef([]);

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
    const [colaLlamados, setColaLlamados] = useState([]);
    const [yaAnunciados, setYaAnunciados] = useState(turnoActualInicial ? [turnoActualInicial.id] : []);
    const [llamadosActivos, setLlamadosActivos] = useState([]);

    // Playlist de videos
    const playlistIds = [
        "LT42fRHkxEc", "SqBeOiTOhE4", "7fQpAnZpEbk", 
        "fmneZiWgtEU", "2TVT-v56W9M", "J5tfdua9zLo", "f2LA_i2MsPk"
    ];

    const activarAudio = async () => {
        setAudioEnabled(true);
    };
    const anunciarTurno = (turno, taquilla) => {
        if (!audioEnabled) return;
        
        // Pre-cargar y reproducir el chime de forma más robusta
        const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        chime.volume = 0.6;
        
        chime.play().then(() => {
            // Esperar un poco a que termine el sonido para empezar a hablar
            setTimeout(() => {
                if (!window.speechSynthesis) return;
                
                // Limpiar cualquier voz pendiente y forzar reinicio (truco para Chrome/Edge)
                window.speechSynthesis.cancel();
                window.speechSynthesis.resume();
                
                let textModulo = String(taquilla || '').replace(/Taquilla/gi, 'Módulo');
                // Mejorar pronunciación: P-001 -> "P, cero, cero, uno"
                const turnoPronunciacion = String(turno || '')
                    .replace(/-/g, ' ')
                    .split('')
                    .join(' ');
                    
                const mensaje = `Turno. ${turnoPronunciacion}. Pase a. ${textModulo}.`;
                const ut = new SpeechSynthesisUtterance(mensaje);
                
                ut.lang = 'es-MX';
                ut.rate = 0.85;
                ut.pitch = 1.0;
                ut.volume = 1.0;
                
                // Intentar encontrar la mejor voz disponible
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    const preferredVoice = voices.find(v => 
                        v.lang.includes('es-MX') || 
                        v.lang.includes('es-ES') || 
                        v.lang.includes('es-US')
                    ) || voices[0];
                    ut.voice = preferredVoice;
                }

                // Eventos de depuración
                ut.onstart = () => console.log("Empezando a hablar...");
                ut.onerror = (e) => console.error("Error de voz:", e);

                window.speechSynthesis.speak(ut);
            }, 800);
        }).catch(e => {
            console.error("Error al reproducir el sonido de alerta:", e);
            // Si el sonido falla, intentamos hablar de todos modos
            window.speechSynthesis.speak(new SpeechSynthesisUtterance("Atención. Nuevo turno."));
        });
    };

    // Polling cada 5 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            fetch('/pantalla/turnos')
                .then(res => res.json())
                .then(data => {
                    const currentWaitIds = JSON.stringify(filaEspera.map(t => t.id || t.turno_numero));
                    const nextWaitIds = JSON.stringify((data.enEspera || []).map(t => t.id || t.turno_numero));
                    
                    if (currentWaitIds !== nextWaitIds) {
                        setFilaEspera(data.enEspera || []);
                    }
                    
                    setLlamadosActivos(data.llamando || []);
                    
                    if (data.llamando && data.llamando.length > 0) {
                        data.llamando.forEach(t => {
                            const callKey = `${t.id}-${t.updated_at}`;
                            if (!yaAnunciados.includes(callKey)) {
                                setColaLlamados(prev => [...prev, t]);
                                setYaAnunciados(prev => [...prev, callKey]);
                            }
                        });
                    }

                    if (!isCalling) {
                        setTurnoActual(data.actual);
                    }
                })
                .catch(err => console.error("Error fetching turnos:", err));
        }, 5000);
        
        return () => clearInterval(interval);
    }, [turnoActual, audioEnabled, yaAnunciados, isCalling, filaEspera]);

    // Procesar la cola de llamados
    useEffect(() => {
        if (!isCalling && colaLlamados.length > 0) {
            const proximo = colaLlamados[0];
            setColaLlamados(prev => prev.slice(1));
            
            setTurnoActual(proximo);
            setIsCalling(true);
            anunciarTurno(proximo.turno_numero, proximo.taquilla);
            
            setTimeout(() => {
                setIsCalling(false);
            }, 8000);
        }
    }, [colaLlamados, isCalling]);

    // --- ANIMACIONES GSAP OPTIMIZADAS ---
    useGSAP(() => {
        if (isCalling && callingOverlayRef.current) {
            const tl = gsap.timeline();
            
            tl.fromTo(callingOverlayRef.current, 
                { opacity: 0 }, 
                { opacity: 1, duration: 0.4, ease: "none" }
            );

            tl.fromTo(callingTitleRef.current,
                { y: -30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
                "-=0.2"
            );

            tl.fromTo(turnoNumberRef.current, 
                { scale: 0.7, opacity: 0 }, 
                { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.2)" },
                "-=0.3"
            );

            tl.fromTo(taquillaBoxRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
                "-=0.4"
            );

            gsap.to(glowRef.current, {
                opacity: 0.1,
                repeat: -1,
                yoyo: true,
                duration: 1.5,
                ease: "sine.inOut"
            });

            return () => tl.kill();
        }
    }, [isCalling]);

    useGSAP(() => {
        if (filaEspera.length > 0) {
            gsap.set(listItemsRef.current, { clearProps: "all" });
            gsap.fromTo(listItemsRef.current, 
                { x: -15, opacity: 0 }, 
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out" }
            );
        }
    }, [filaEspera]);

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

            {/* ACTIVACIÓN AUDIO */}
            <AnimatePresence>
                {!audioEnabled && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500] bg-[#0B3D2E]/95 backdrop-blur-sm flex flex-col items-center justify-center text-white p-10 text-center">
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

            {/* OVERLAY LLAMANDO (OPTIMIZADO) */}
            {isCalling && (
                <div ref={callingOverlayRef} className="absolute inset-0 z-[400] flex items-center justify-center bg-[#0a1a14]/90 p-10 overflow-hidden">
                    <div ref={glowRef} className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                        <div className="w-[80%] h-[80%] rounded-full blur-[100px]" style={{ backgroundColor: currentColors.glow }}></div>
                    </div>
                    
                    <div className="relative flex flex-col items-center justify-center max-w-full">
                        <div ref={callingTitleRef} className="mb-10 flex flex-col items-center gap-4">
                            <div className={`p-6 rounded-full ${currentColors.bg} text-white shadow-xl border-4 border-white/10`}><BellRing size={60} /></div>
                            <span className="text-white text-4xl font-black uppercase tracking-[0.5em]">Llamado de Turno</span>
                        </div>
                        
                        <div className="relative mb-12">
                            <h1 ref={turnoNumberRef} className={`text-[28vw] font-black leading-none tracking-tighter ${currentColors.text} drop-shadow-2xl`}>
                                {turnoActual?.turno_numero || turnoActual?.turno}
                            </h1>
                        </div>

                        <div ref={taquillaBoxRef} className="flex items-center gap-12">
                            <div className="h-0.5 w-40 bg-white/10" />
                            <div className={`px-24 py-10 rounded-[4rem] ${currentColors.bg} border-4 border-white/10 shadow-2xl`}>
                                <p className="text-white text-[12vw] font-black leading-none uppercase tracking-tighter">
                                    {String(turnoActual?.taquilla || '').replace(/Taquilla/gi, 'Módulo')}
                                </p>
                            </div>
                            <div className="h-0.5 w-40 bg-white/10" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden p-[2vh] gap-[3vh] flex-row">
                <div className="flex-[7] flex flex-col gap-[2vh]">
                    <div className="flex-[6] bg-black rounded-[4rem] overflow-hidden relative shadow-2xl border-4 border-white/10">
                        {audioEnabled ? (
                            <iframe 
                                className="w-full h-full object-cover opacity-80"
                                src={`https://www.youtube.com/embed/${playlistIds[0]}?autoplay=1&mute=1&loop=1&playlist=${playlistIds.join(',')}&controls=0&modestbranding=1&rel=0`}
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
                        {/* SENA APE TV BLOQUE ELIMINADO */}
                    </div>

                    <div className={`flex-[4] bg-white rounded-[4rem] p-[4vh] flex items-center shadow-2xl border-4 ${currentColors.border} overflow-hidden`}>
                        <div className="flex-1 min-w-0">
                            <span className={`${currentColors.text} font-black uppercase tracking-[0.4em] text-[1.6vh] block mb-4 opacity-70`}>Turno Actual • {turnoActual?.tipo}</span>
                            <h1 className={`text-[15vh] font-black leading-none ${currentColors.text} drop-shadow-sm whitespace-nowrap`}>
                                {turnoActual?.turno_numero || turnoActual?.turn || turnoActual?.turno || '---'}
                            </h1>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[#0B3D2E]/30 font-black uppercase tracking-[0.2em] text-[1.8vh] mb-4">Módulo de Atención</p>
                            <div className={`${currentColors.bg} text-white px-[4vw] py-[2.5vh] rounded-[3rem] shadow-2xl border-4 border-white/20 inline-block`}>
                                <span className="font-black text-[9vh] leading-none uppercase tracking-tighter whitespace-nowrap">
                                    {String(turnoActual?.taquilla || '').replace(/Taquilla/gi, 'Módulo')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-[3] flex flex-col gap-[2vh] overflow-hidden">
                    <AnimatePresence>
                        {llamadosActivos.length > 0 && (
                            <motion.div 
                                initial={{ x: -50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -50, opacity: 0 }}
                                className="flex-[4] bg-white rounded-[4rem] border-4 border-[#39A900] shadow-xl flex flex-col overflow-hidden relative"
                            >
                                <div className="p-[3vh] bg-[#39A900] text-white flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                                        <h2 className="text-[1.8vh] font-black uppercase tracking-widest">Llamados Recientes</h2>
                                    </div>
                                    <Megaphone size={20} className="opacity-50" />
                                </div>
                                <div className="flex-1 p-[2vh] space-y-3 overflow-y-auto custom-scrollbar">
                                    {llamadosActivos.map((ll) => (
                                        <div 
                                            key={ll.id} 
                                            className="flex justify-between items-center p-5 bg-green-50 rounded-[2rem] border-2 border-green-100 shadow-sm"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-[#39A900]/50 uppercase tracking-widest leading-none mb-1">Turno</span>
                                                <span className="text-4xl font-black text-[#39A900] leading-none">{ll.turno_numero}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-[#39A900]/50 uppercase tracking-widest leading-none mb-1">Módulo</p>
                                                <p className="text-2xl font-black text-[#0B3D2E] uppercase tracking-tighter leading-none">
                                                    {String(ll.taquilla || '').replace(/Taquilla/gi, 'Módulo')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex-[6] bg-white rounded-[4rem] border-4 border-gray-100 flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-[4vh] bg-[#0B3D2E] text-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Users size={32} className="text-[#39A900]" />
                                <h2 className="text-[2.4vh] font-black uppercase tracking-[0.2em]">En Espera</h2>
                            </div>
                        </div>
                        <div className="flex-1 p-[3vh] flex flex-col gap-[2vh] overflow-y-auto">
                            {filaEspera.map((item, index) => {
                                const colors = getTipoColor(item.tipo);
                                return (
                                    <div 
                                        key={item.id || item.turn || item.turno || index} 
                                        ref={el => listItemsRef.current[index] = el}
                                        className={`p-[3.5vh] rounded-[2.5rem] border-2 ${colors.border}/10 ${colors.light} flex justify-between items-center shadow-sm`}
                                    >
                                        <span className={`text-[4.5vh] font-black ${colors.text}`}>{item.turno_numero || item.turn || item.turno || '---'}</span>
                                        <span className={`text-[1.2vh] font-black px-4 py-2 rounded-xl bg-white border ${colors.border}/20 ${colors.text} uppercase tracking-widest shadow-sm`}>{item.tipo}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[8vh] bg-black flex items-center overflow-hidden border-t-4 border-[#39A900]">
                <div className="bg-[#39A900] h-full px-16 flex items-center z-10 shadow-[20px_0_40_rgba(0,0,0,0.5)]">
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
