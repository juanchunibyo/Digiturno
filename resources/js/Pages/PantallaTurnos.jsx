import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Megaphone, MonitorPlay, Calendar, MapPin, History, Info } from 'lucide-react';

export default function PantallaTurnos() {
    // --- DATOS INICIALES FALSOS ---
    const initialFila = [
        { turno: 'V-055', tipo: 'Víctima' },
        { turno: 'G-120', tipo: 'General' },
        { turno: 'P-088', tipo: 'Prioritario' },
        { turno: 'E-034', tipo: 'Empresa' },
        { turno: 'V-056', tipo: 'Víctima' },
    ];

    const initialHistorial = [
        { turno: 'G-119', taquilla: 'Taquilla 2', tipo: 'General' },
        { turno: 'V-054', taquilla: 'Taquilla 5', tipo: 'Víctima' },
    ];

    // --- ESTADOS ---
    const [currentTime, setCurrentTime] = useState(new Date());
    const [turnoActual, setTurnoActual] = useState({ turno: 'V-054', taquilla: 'Taquilla 5', tipo: 'Víctima' });
    const [filaEspera, setFilaEspera] = useState(initialFila);
    const [historial, setHistorial] = useState(initialHistorial);
    const [isCalling, setIsCalling] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [audioContext, setAudioContext] = useState(null);

    // --- AUDIO ---
    // Función para activar el audio
    const activarAudio = async () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContext();
            
            // Forzar el inicio del contexto (importante para navegadores modernos)
            if (context.state === 'suspended') {
                await context.resume();
            }

            setAudioContext(context);
            setAudioEnabled(true);
            
            // Prueba de sonido inmediata
            playHospitalChime(context, () => {
                const ut = new SpeechSynthesisUtterance("Sistema de audio activado. El volumen está al máximo.");
                ut.lang = 'es-MX';
                ut.volume = 1;
                ut.rate = 0.9;
                window.speechSynthesis.speak(ut);
            });
        } catch (e) {
            console.error("Error activando audio:", e);
        }
    };

    const playHospitalChime = (context, onFinished) => {
        if (!context) return onFinished?.();
        
        // Asegurar que el contexto esté activo antes de tocar
        if (context.state === 'suspended') context.resume();

        const now = context.currentTime;
        const playNote = (freq, startTime, duration, volume) => {
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            osc.connect(gain);
            gain.connect(context.destination);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // Timbre de hospital reforzado (Más fuerte)
        playNote(659.25, now, 0.8, 0.8);        // Mi
        playNote(523.25, now + 0.4, 1.2, 0.7);  // Do

        if (onFinished) setTimeout(onFinished, 1800);
    };

    const anunciarTurno = (turno, taquilla, tipo) => {
        if (!audioEnabled || !audioContext) return;
        const reproducirVoz = () => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const t = `Turno ${turno.split('').join(' ')}, pase a ${taquilla}.`;
            const ut = new SpeechSynthesisUtterance(t);
            ut.lang = 'es-MX';
            ut.rate = 0.95;
            window.speechSynthesis.speak(ut);
        };
        playHospitalChime(audioContext, reproducirVoz);
    };

    // --- SIMULADOR ---
    useEffect(() => {
        const flowInterval = setInterval(() => {
            if (filaEspera.length === 0) {
                setFilaEspera(initialFila);
                return;
            }
            const proximo = filaEspera[0];
            const nuevasFila = filaEspera.slice(1);
            const taquillaRandom = `Taquilla ${Math.floor(Math.random() * 6) + 1}`;
            const turnoLlamado = { ...proximo, taquilla: taquillaRandom };

            setIsCalling(true);
            setTurnoActual(turnoLlamado);
            anunciarTurno(turnoLlamado.turno, turnoLlamado.taquilla, turnoLlamado.tipo);

            setTimeout(() => {
                setIsCalling(false);
                setHistorial(prev => [turnoLlamado, ...prev.slice(0, 3)]);
                setFilaEspera(nuevasFila);
            }, 7000);
        }, 15000);
        return () => clearInterval(flowInterval);
    }, [filaEspera, audioEnabled]);

    useEffect(() => {
        const t = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // --- ANUNCIOS (CARRUSEL) ---
    const [currentAd, setCurrentAd] = useState(0);
    const anuncios = [
        { title: 'Actualiza tu Hoja de Vida', desc: 'Ingresa a ape.sena.edu.co y mantén tus datos al día para mejores oportunidades.', icon: <Users size={60} /> },
        { title: 'Cursos Gratuitos', desc: '¡Inscríbete ya! Tenemos formación en tecnología, bilingüismo y más.', icon: <MonitorPlay size={60} /> },
        { title: 'Documentación', desc: 'Recuerde presentar su documento de identidad original al ser llamado en taquilla.', icon: <Info size={60} /> },
        { title: 'Servicios Gratuitos', desc: 'Todos los servicios de la APE son gratuitos. ¡No use intermediarios!', icon: <Megaphone size={60} /> },
    ];

    useEffect(() => {
        const adTimer = setInterval(() => {
            setCurrentAd(prev => (prev + 1) % anuncios.length);
        }, 10000);
        return () => clearInterval(adTimer);
    }, []);

    const formatTime = (date) => date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const formatDate = (date) => date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="w-full h-screen bg-[#F0F4F1] text-[#0B3D2E] font-['Inter',sans-serif] overflow-hidden select-none flex flex-col relative">
            <Head><title>Pantalla de Turnos | SENA APE</title></Head>

            {/* OVERLAY ACTIVACIÓN AUDIO */}
            <AnimatePresence>
                {!audioEnabled && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[500] bg-black/60 backdrop-blur-md flex items-center justify-center">
                        <motion.button onClick={activarAudio} className="bg-[#39A900] text-white px-16 py-8 rounded-full font-black text-4xl shadow-2xl border-4 border-white flex items-center gap-6">
                            <Megaphone size={60} className="animate-bounce" />
                            ACTIVAR PANTALLA
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ANUNCIO GIGANTE */}
            <AnimatePresence>
                {isCalling && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[400] flex items-center justify-center bg-white/95 backdrop-blur-2xl p-10">
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[5rem] p-20 shadow-2xl border-[15px] border-[#39A900] flex flex-col items-center text-center">
                            <span className="text-[#39A900] font-black uppercase tracking-[0.5em] text-4xl mb-10 animate-pulse">Llamando Ahora</span>
                            <h1 className="text-[20vw] font-black leading-none text-[#39A900] mb-10">{turnoActual?.turno}</h1>
                            <div className="bg-[#0B3D2E] text-white px-20 py-8 rounded-[3rem] shadow-xl">
                                <p className="text-[8vw] font-black leading-none">{turnoActual?.taquilla}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONTENIDO 2 COLUMNAS (Clásico) */}
            <div className="flex flex-1 overflow-hidden p-[2vh] gap-[3vh] flex-row-reverse">
                
                {/* DERECHA: Video y Llamado Actual */}
                <div className="flex-[7] flex flex-col gap-[2vh]">
                    <div className="flex-[6] bg-black rounded-[3rem] overflow-hidden relative shadow-2xl border-4 border-[#39A900]/20 flex flex-col items-center justify-center group">
                        
                        {/* REPRODUCTOR DE VIDEO REAL */}
                        <video 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover opacity-80"
                            src="https://assets.mixkit.co/videos/preview/mixkit-working-at-a-clean-and-modern-office-4436-large.mp4"
                        >
                            Tu navegador no soporta el elemento de video.
                        </video>

                        {/* Overlay de 'En Vivo' / Info */}
                        <div className="absolute top-8 left-8 flex items-center gap-3 bg-red-600/90 backdrop-blur-md px-6 py-2 rounded-full border-2 border-white/20 shadow-xl z-10">
                            <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                            <span className="text-white font-black uppercase tracking-[0.2em] text-[1.2vh]">SENA APE TV</span>
                        </div>

                        {/* Ticker de información sobre el video (opcional) */}
                        <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-black via-black/40 to-transparent">
                            <div className="flex items-center gap-4">
                                <MonitorPlay className="text-[#39A900]" size={24} />
                                <span className="text-white font-bold text-[1.8vh] uppercase tracking-widest opacity-80">Reproduciendo: Anuncios Institucionales 2024</span>
                            </div>
                        </div>

                        {/* Marco de enfoque visual */}
                        <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none"></div>
                    </div>

                    <div className="flex-[4] bg-white rounded-[3rem] p-[4vh] flex items-center shadow-xl border-4 border-[#39A900]/10 overflow-hidden">
                        <div className="flex-1">
                            <span className="text-[#39A900] font-black uppercase tracking-[0.3em] text-[1.5vh] block mb-4">Turno Actual</span>
                            <h1 className="text-[18vh] font-black leading-none text-[#0B3D2E]">{turnoActual?.turno}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-[#0B3D2E]/40 font-black uppercase tracking-widest text-[2vh] mb-4">Taquilla</p>
                            <div className="bg-[#39A900] text-white px-[4vw] py-[2vh] rounded-[2.5rem] shadow-xl border-4 border-white inline-block">
                                <span className="font-black text-[10vh] leading-none uppercase">{turnoActual?.taquilla}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* IZQUIERDA (Barra Lateral): Arriba Espera, Abajo Historial */}
                <div className="flex-[3] flex flex-col gap-[2vh] overflow-hidden">
                    
                    {/* SECCIÓN ARRIBA: EN ESPERA */}
                    <div className="flex-[6] bg-white rounded-[3rem] border-4 border-[#39A900]/10 flex flex-col overflow-hidden shadow-xl">
                        <div className="p-[3vh] bg-[#39A900] text-white flex items-center gap-4">
                            <Users size={30} />
                            <h2 className="text-[2.2vh] font-black uppercase tracking-widest">En Espera</h2>
                        </div>
                        <div className="flex-1 p-[2vh] flex flex-col gap-[1.5vh] overflow-y-auto">
                            <AnimatePresence mode="popLayout">
                                {filaEspera.map((item) => (
                                    <motion.div key={item.turno} layout initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="p-[2.5vh] rounded-[1.5rem] border-2 border-gray-100 bg-[#F8FAF9] flex justify-between items-center">
                                        <span className="text-[4vh] font-black text-[#0B3D2E]">{item.turno}</span>
                                        <span className="text-[1vh] font-black px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-400 uppercase tracking-widest">{item.tipo}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* SECCIÓN ABAJO: HISTORIAL (YA LLAMADOS) */}
                    <div className="flex-[4] bg-[#0B3D2E] rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-[2.5vh] bg-black/30 border-b border-white/5 flex items-center gap-4 text-white">
                            <History size={24} className="text-[#39A900]" />
                            <h2 className="text-[1.8vh] font-black uppercase tracking-widest">Historial</h2>
                        </div>
                        <div className="flex-1 p-[2vh] flex flex-col gap-[1vh] overflow-hidden">
                            {historial.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-[1.5vh] rounded-[1.2rem] bg-white/5 border border-white/5">
                                    <span className="text-[2.5vh] font-black text-white">{item.turno}</span>
                                    <span className="text-[1.5vh] font-black text-[#39A900] uppercase tracking-tighter">{item.taquilla}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* TICKER INFERIOR */}
            <div className="h-[7vh] bg-[#39A900] flex items-center overflow-hidden border-t-4 border-white/20">
                <div className="bg-black h-full px-12 flex items-center z-10 shadow-xl">
                    <span className="text-[#39A900] font-black uppercase tracking-widest text-[1.8vh] whitespace-nowrap">SENA APE</span>
                </div>
                <div className="flex-1 relative flex items-center overflow-hidden">
                    <motion.p animate={{ x: ['100%', '-100%'] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="whitespace-nowrap text-[2.5vh] font-black uppercase text-white tracking-widest">
                        ★ SERVICIOS GRATUITOS ★ SIN INTERMEDIARIOS ★ CONSULTE VACANTES EN APE.SENA.EDU.CO ★ BIENVENIDOS ★
                    </motion.p>
                </div>
                <div className="bg-black/50 h-full px-10 flex items-center text-white font-black text-[2.5vh] tracking-tighter">
                    {formatTime(currentTime)}
                </div>
            </div>
        </div>
    );
}
