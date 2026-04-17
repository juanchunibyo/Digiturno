import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottiePlayer } from '@dotlottie/react-player';
import {
    LogOut, Timer, ChevronRight, Ban, CheckCircle2, AlertTriangle,
    ClipboardList, Clock, PhoneCall, UserCheck, MessageSquare, XCircle, PauseCircle, Check, Edit3, ArrowRight
} from 'lucide-react';

// --- Datos mock ---
const initialQueue = [
    { id: 't-042', turn: 'N-042', doc: '1.023.456.678', timeWait: '0 minutos', type: 'Atención Prioritaria', typeColor: 'bg-red-700', service: 'Tipo de atención N-042' },
    { id: 't-043', turn: 'N-043', doc: '1.023.456.678', timeWait: '20 minutos', type: 'Atención Prioritaria', typeColor: 'bg-red-700', service: 'Tipo de atención N-043' },
    { id: 't-044', turn: 'N-044', doc: '1.085.987.123', timeWait: '20 minutos', type: 'Atención Empresa', typeColor: 'bg-blue-700', service: 'Empresa: "Inversiones del Caribe"' },
    { id: 't-045', turn: 'N-045', doc: '1.144.331.890', timeWait: '45 minutos', type: 'Atención Interna SENA', typeColor: 'bg-green-700', service: 'Tipo de atención N-045' },
    { id: 't-046', turn: 'N-046', doc: '1.020.884.111', timeWait: '60 minutos', type: 'Atención Normal', typeColor: 'bg-gray-700', service: 'Tipo de atención N-046' }
];

const HISTORY = [
    { turn: 'N-041', doc: '1.034.225.732', type: 'Normal', typeDetails: 'Empresa: SENA', duration: '14:22', obs: 'CV revisada', status: 'COMPLETADO', statusColor: 'bg-green-100 text-green-700' },
    { turn: 'N-040', doc: '1.085.118.112', type: 'Empresa', typeDetails: 'Inversiones del Caribe', duration: '--', obs: '--', status: 'NO ASISTIÓ', statusColor: 'bg-red-100 text-red-700' },
    { turn: 'N-039', doc: '1.085.457.999', type: 'Prioritaria', typeDetails: '--', duration: '28:10', obs: 'Orientación de carrera', status: 'COMPLETADO', statusColor: 'bg-green-100 text-green-700' },
];

const STEP_DEFS = [
    { key: 'llamado',     label: 'Llamado',    Icon: PhoneCall },
    { key: 'checkin',     label: 'Check-in',   Icon: UserCheck },
    { key: 'consultoria', label: 'Consultoría', Icon: MessageSquare },
    { key: 'cierre',      label: 'Cierre',     Icon: XCircle },
];

function useTimer() {
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, [running]);

    const start = () => { setSeconds(0); setRunning(true); };
    const stop  = () => setRunning(false);
    const reset = () => { setSeconds(0); setRunning(false); };
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    const display = `${m}:${s}`;
    return { display, running, start, stop, reset, seconds };
}

export default function Dashboard({ auth }) {
    const user = auth.user;
    const { display: elapsed, running: timerRunning, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer();

    const [queueItems, setQueueItems] = useState(initialQueue.slice(1));
    const [activeTurn, setActiveTurn] = useState(initialQueue[0]);
    const [historyItems, setHistoryItems] = useState(HISTORY);
    
    const [steps, setSteps] = useState({ llamado: null, checkin: null, consultoria: null, cierre: null });
    const [isPaused, setIsPaused] = useState(false);
    const [observaciones, setObservaciones] = useState('');
    const [showSuccessAnim, setShowSuccessAnim] = useState(false);

    const nowTime = () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const avanzaTurnoAnimate = (estado) => {
        setIsPaused(false);
        stopTimer();
        
        if (activeTurn) {
            const newHistory = {
                turn: activeTurn.turn,
                doc: activeTurn.doc,
                type: activeTurn.type.replace('Atención ', ''),
                typeDetails: activeTurn.service,
                duration: elapsed,
                obs: observaciones || '--',
                status: estado,
                statusColor: estado === 'COMPLETADO' ? 'bg-green-100 text-green-700' : (estado === 'NO ASISTIÓ' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')
            };
            setHistoryItems(prev => [newHistory, ...prev]);
        }

        setSteps({ llamado: null, checkin: null, consultoria: null, cierre: null });
        setObservaciones('');
        resetTimer();

        if (queueItems.length > 0) {
            const nextTurn = queueItems[0];
            setActiveTurn(nextTurn);
            setQueueItems(prev => prev.slice(1));
        } else {
            setActiveTurn(null);
        }
    };

    const handleSiguienteTurnoManual = () => {
        avanzaTurnoAnimate('ASIGNADO/OTRO');
    };

    const handleNoAsistio = () => {
        avanzaTurnoAnimate('NO ASISTIÓ');
    };

    const handleFinalizar = () => {
        setShowSuccessAnim(true);
        stopTimer();
        
        setTimeout(() => {
            avanzaTurnoAnimate('COMPLETADO');
            setShowSuccessAnim(false);
        }, 2200); // Duración de la animación lottie aprox
    };

    useEffect(() => {
        if (steps.consultoria && !steps.cierre && !timerRunning && !isPaused && !showSuccessAnim) {
            startTimer();
        } else if ((!steps.consultoria || steps.cierre || isPaused || showSuccessAnim) && timerRunning) {
            stopTimer();
        }
    }, [steps.consultoria, steps.cierre, timerRunning, isPaused, showSuccessAnim, startTimer, stopTimer]);

    const handleStep = (key) => {
        const order = ['llamado', 'checkin', 'consultoria', 'cierre'];
        const idx = order.indexOf(key);
        const prev = order[idx - 1];
        if (idx > 0 && !steps[prev]) return;
        if (steps[key]) return;

        setSteps(s => ({ ...s, [key]: nowTime() }));
    };

    const disableSiguiente = (!!steps.llamado && !steps.cierre) || isPaused || showSuccessAnim;
    const disableNoAsistio = !!steps.checkin || !steps.llamado || isPaused || showSuccessAnim;
    const disableDescansoBtn = !!steps.llamado && !steps.cierre || showSuccessAnim;
    const disableFinalizar = !steps.cierre || showSuccessAnim;

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F6F9] font-['Inter',sans-serif] text-gray-800 overflow-hidden">
            <Head><title>Control Center | SENA APE</title></Head>

            {/* HEADER */}
            <header className="h-[5.5rem] bg-white shadow-sm flex items-center justify-between px-8 shrink-0 relative z-10 w-full">
                <div className="flex items-center gap-6">
                    <img src="/logo-ape.png" alt="SENA APE" className="h-12 object-contain" />
                    <div className="hidden sm:block border-l-2 border-gray-200 pl-6">
                        <p className="text-[#0B3D2E] font-black text-base leading-none">SENA APE</p>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Control Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Link href={route('logout')} method="post" as="button" className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Cerrar Sesión">
                        <LogOut size={24} />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#39A900] text-white flex items-center justify-center text-lg font-black shadow-md">
                            {user?.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div className="hidden sm:block text-right">
                            <p className="text-base font-bold text-gray-800 leading-none">{user?.name || 'carlos vilagran'}</p>
                            <p className="text-xs text-gray-500 mt-1">Sede Central</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-6 lg:p-8 2xl:p-12 flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* COLUMNA 1: En Espera */}
                    <div className="lg:col-span-3 flex flex-col gap-5">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">En Espera</h2>
                        
                        <div className="flex flex-col gap-4 relative">
                            <AnimatePresence>
                                {queueItems.map((item) => (
                                    <motion.div 
                                        layoutId={item.id} 
                                        key={item.id} 
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                                        className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-3xl font-black text-gray-800 leading-none mb-1">{item.turn}</h3>
                                                <p className="text-lg font-bold text-gray-600 font-mono tracking-wider">CC: {item.doc}</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-xl ${item.typeColor} text-white flex flex-col items-center justify-center w-32 text-center`}>
                                                <span className="text-sm font-bold leading-tight">{item.type}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-6">
                                            <div>
                                                <p className="text-sm text-gray-500">Tiempo: {item.timeWait}</p>
                                                <p className="text-sm text-gray-500">{item.service}</p>
                                            </div>
                                            <div className="flex flex-col items-center text-gray-400">
                                                <ClipboardList size={22} />
                                                <span className="text-[10px] font-bold mt-1 text-center leading-none">Formulario<br/>Revisado</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {queueItems.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <CheckCircle2 size={48} className="mx-auto mb-4 text-gray-400" />
                                    <p className="font-bold text-xl text-gray-500">Sin ciudadanos en fila</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA 2: Atención Actual */}
                    <div className="lg:col-span-6 flex flex-col gap-5 relative">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">Atención Actual</h2>

                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[110%] h-[110%] bg-orange-500/20 rounded-full blur-3xl -z-10 animate-pulse hidden lg:block" style={{ opacity: steps.llamado && !steps.cierre ? 0.3 : 0 }}></div>

                        <AnimatePresence mode="wait">
                            {activeTurn ? (
                                <motion.div 
                                    layoutId={activeTurn.id} 
                                    key={activeTurn.id}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                                    className="bg-white border-2 border-gray-100 rounded-3xl p-8 2xl:p-12 shadow-xl shadow-orange-900/5 relative z-10 flex flex-col min-h-[600px] overflow-hidden">
                                    
                                    {/* ANIMATION OVERLAY */}
                                    <AnimatePresence>
                                        {showSuccessAnim && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
                                                <motion.div 
                                                    initial={{ scale: 0.5, y: 50 }}
                                                    animate={{ scale: 1, y: 0 }}
                                                    transition={{ type: "spring", bounce: 0.5 }}
                                                    className="flex flex-col items-center">
                                                    <div style={{ width: 300, height: 300 }}>
                                                        <DotLottiePlayer
                                                          src="/success.lottie"
                                                          autoplay
                                                          loop={false}
                                                        />
                                                    </div>
                                                    <h2 className="text-4xl font-black text-[#1B4332] mt-4 tracking-tight">Atención Exitosa</h2>
                                                    <p className="text-gray-500 font-bold mt-2">Guardando y llamando al siguiente turno...</p>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Header Atención */}
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <p className="text-base font-bold text-gray-500 uppercase tracking-widest mb-2">Turno</p>
                                            <h1 className="text-7xl 2xl:text-8xl font-black text-[#0B3D2E] leading-none mb-4">{activeTurn.turn}</h1>
                                            <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl text-lg font-bold shadow-inner ${timerRunning ? 'bg-[#39A900] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                <span className="text-2xl tracking-widest">{elapsed}</span> <span className="text-xs tracking-normal mb-0.5">MIN</span>
                                            </div>
                                        </div>
                                        <div className="text-left border-l-2 border-gray-100 pl-8 2xl:pl-12">
                                            <p className="text-base font-bold text-gray-500 mb-2">DOCUMENTO DE IDENTIDAD</p>
                                            <h2 className="text-5xl font-black text-[#1B4332] tracking-tight mb-4 flex">{activeTurn.doc}</h2>
                                            <h3 className="text-3xl font-bold text-red-700 tracking-tight">{activeTurn.type}</h3>
                                        </div>
                                    </div>

                                    {/* Progreso (Steps) */}
                                    <div className="my-8">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">PROGRESO DE LA ATENCIÓN</p>
                                        <div className="relative flex justify-between items-center w-full px-2">
                                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 -translate-y-1/2 mx-16"></div>
                                            
                                            {STEP_DEFS.map((step, i) => {
                                                const done = !!steps[step.key];
                                                const order = ['llamado','checkin','consultoria','cierre'];
                                                const isActive = steps[order[i]] && (!order[i+1] || !steps[order[i+1]]);
                                                const prevDone = i === 0 || !!steps[order[i - 1]];
                                                const isNext = !done && prevDone;

                                                return (
                                                    <button
                                                        key={step.key}
                                                        onClick={() => handleStep(step.key)}
                                                        disabled={done || !prevDone || isPaused}
                                                        className={`relative py-3 2xl:py-4 px-6 2xl:px-8 rounded-full border-2 flex items-center gap-3 text-lg font-semibold transition-all shadow-sm bg-white
                                                            ${done && !isActive ? 'text-gray-500 border-gray-200' : ''}
                                                            ${isActive ? 'border-[#39A900] text-[#1B4332] shadow-xl shadow-[#39A900]/10 scale-105 ring-2 ring-[#39A900]/30' : ''}
                                                            ${isNext ? 'border-gray-300 text-gray-600 hover:border-[#39A900] hover:text-[#39A900] cursor-pointer' : ''}
                                                            ${!done && !isNext && !isActive ? 'border-gray-200 opacity-50 cursor-not-allowed bg-gray-50' : ''}
                                                        `}>
                                                        
                                                        {done && !isActive ? (
                                                            <span className="bg-[#39A900] text-white rounded-full p-1"><Check size={18} strokeWidth={4} /></span>
                                                        ) : isActive ? (
                                                            <span className="bg-[#1B4332] text-white rounded-full p-1.5 shadow-md flex items-center justify-center">
                                                                <step.Icon size={18} strokeWidth={2.5} />
                                                            </span>
                                                        ) : (
                                                            <span className="w-6 h-6 rounded-full border-[3px] border-current flex items-center justify-center text-xs font-black">{i + 1}</span>
                                                        )}
                                                        <span className="ml-1">{step.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div className="mt-auto flex flex-col pt-6">
                                        <label className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                                            <Edit3 size={18} /> Observaciones de la Atención
                                        </label>
                                        <textarea 
                                            className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-base lg:text-lg text-gray-700 min-h-[140px] focus:ring-2 focus:ring-[#39A900] focus:border-[#39A900] outline-none resize-none shadow-sm"
                                            placeholder="Ingrese aquí los detalles y conclusiones de la atención brindada..."
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                            readOnly={isPaused || !activeTurn}
                                        ></textarea>
                                        
                                        <button 
                                            onClick={handleFinalizar}
                                            disabled={disableFinalizar}
                                            className={`w-full mt-6 py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-[0_6px_20px_rgba(0,0,0,0.1)] group text-lg tracking-wide relative overflow-hidden
                                                ${disableFinalizar ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-[1.02]'}`}>
                                            <ClipboardList size={24} /> FINALIZAR Y ARCHIVAR ATENCIÓN <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white border-2 border-gray-100 rounded-3xl p-12 flex flex-col items-center justify-center h-full min-h-[600px]">
                                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 size={64} className="text-[#39A900]" />
                                    </div>
                                    <h2 className="text-4xl font-black text-gray-800">No hay turnos activos</h2>
                                    <p className="text-gray-500 text-lg mt-2">Atiende al siguiente ciudadano en la fila.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* COLUMNA 3: Comandos y Resumen */}
                    <div className="lg:col-span-3 flex flex-col gap-5">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">Control y Resumen</h2>
                        
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={handleSiguienteTurnoManual}
                                disabled={disableSiguiente}
                                className={`w-full py-7 rounded-2xl font-black text-lg tracking-widest flex items-center justify-center gap-3 transition-all border-2
                                    ${disableSiguiente ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300 shadow-md hover:-translate-y-1'}`}>
                                <ArrowRight size={26} className={!disableSiguiente ? "text-gray-800" : ""} /> SIGUIENTE TURNO
                            </button>
                            <button
                                onClick={handleNoAsistio}
                                disabled={disableNoAsistio}
                                className={`w-full py-6 rounded-2xl font-black text-lg tracking-widest flex items-center justify-center gap-3 transition-all border-2
                                    ${disableNoAsistio ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-red-50 text-red-600 border-red-200 shadow-md transform hover:-translate-y-1'}`}>
                                <Ban size={26} className={disableNoAsistio ? "text-gray-400" : "text-red-500"} /> NO ASISTIÓ
                            </button>
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                disabled={disableDescansoBtn}
                                className={`w-full py-6 rounded-2xl font-black text-lg tracking-widest flex items-center justify-center gap-3 transition-all border-2
                                    ${disableDescansoBtn ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : isPaused ? 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-300' : 'bg-white hover:bg-orange-50 text-orange-500 border-orange-200 shadow-md hover:-translate-y-1'}`}>
                                <Clock size={26} className={disableDescansoBtn ? "text-gray-400" : isPaused ? "text-orange-600" : "text-orange-500"} /> {isPaused ? 'REANUDAR' : 'TOMAR DESCANSO'}
                            </button>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-black text-2xl text-gray-800 tracking-tight">Estadísticas</h3>
                                <span className="text-xs font-bold bg-gray-200/80 py-1.5 px-3 rounded-lg uppercase tracking-widest text-gray-600">Hoy</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-100/80 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                                    <h4 className="text-3xl font-black text-gray-800 mb-1 leading-none">15<span className="text-base">m</span></h4>
                                    <p className="text-[11px] text-gray-500 font-bold uppercase leading-tight mt-1">Promedio<br/>Atención</p>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-100/80 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                                    <h4 className="text-3xl font-black text-gray-800 mb-1 leading-none">00:00</h4>
                                    <p className="text-[11px] text-gray-500 font-bold uppercase leading-tight mt-1">Tiempo<br/>Libre</p>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} className="bg-gray-100/80 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                                    <h4 className="text-3xl font-black text-gray-800 mb-1 leading-none">{historyItems.length + 130}</h4>
                                    <p className="text-[11px] text-gray-500 font-bold uppercase leading-tight mt-1">Turnos<br/>Hoy</p>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HISTORIAL INFERIOR FULL WIDTH */}
                <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden mt-8 flex-shrink-0">
                    <div className="px-8 py-6 border-b-2 border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-800 text-2xl tracking-tight">Historial Reciente de Atenciones</h2>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left font-['Inter'] whitespace-nowrap">
                            <thead>
                                <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                                    {['TURNO', 'IDENTIFICACIÓN', 'TIPO', 'DURACIÓN', 'OBSERVACIONES', 'ESTADO', ''].map((h, i) => (
                                        <th key={i} className="py-5 px-8 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence>
                                    {historyItems.map((row, idx) => (
                                        <motion.tr 
                                            key={`${row.turn}-${idx}`}
                                            initial={{ opacity: 0, x: -20, backgroundColor: '#f0fdf4' }}
                                            animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                                            transition={{ duration: 0.5 }}
                                            className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-5 px-8 font-black text-gray-800 text-lg">{row.turn}</td>
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-black shrink-0">
                                                        CC
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-bold text-gray-800 leading-none font-mono tracking-wider">{row.doc}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg 
                                                        ${row.type === 'Empresa' ? 'bg-blue-100 text-blue-700' : row.type === 'Prioritaria' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{row.type}</span>
                                                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">{row.typeDetails}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-8 text-base font-semibold text-gray-700">{row.duration}</td>
                                            <td className="py-5 px-8 text-sm text-gray-500 max-w-[280px] truncate">{row.obs}</td>
                                            <td className="py-5 px-8">
                                                <span className={`text-xs font-black uppercase px-4 py-1.5 rounded-xl ${row.statusColor}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="py-5 px-8 text-right">
                                                <button className="text-sm text-[#39A900] hover:text-[#2a7a00] font-black flex items-center gap-1 justify-end ml-auto group">
                                                    <span className="group-hover:translate-x-[-2px] transition-transform">Ver más</span> <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}
