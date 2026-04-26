import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { DotLottiePlayer } from '@dotlottie/react-player';
import {
    LogOut, Timer, ChevronRight, Ban, CheckCircle2, AlertTriangle,
    ClipboardList, Clock, PhoneCall, UserCheck, MessageSquare, XCircle, PauseCircle, Check, Edit3, ArrowRight, Heart
} from 'lucide-react';

// --- Datos mock filtrados para VÍCTIMAS ---
const initialQueue = [
    { id: 'v-043', turn: 'V-043', doc: '1.023.456.678', docType: 'C.C.', timeWait: '20 min', type: 'Atención Víctima', typeColor: 'bg-orange-600', service: 'Víctima' },
    { id: 'v-049', turn: 'V-049', doc: '876.543.210', docType: 'C.E.', timeWait: '55 min', type: 'Atención Víctima', typeColor: 'bg-orange-600', service: 'Víctima' },
    { id: 'v-055', turn: 'V-055', doc: '1.112.223.334', docType: 'C.C.', timeWait: '10 min', type: 'Atención Víctima', typeColor: 'bg-orange-600', service: 'Víctima' },
];

const HISTORY = [
    { turn: 'V-041', doc: '1.034.225.732', type: 'Víctima', typeDetails: '--', duration: '14:22', obs: 'Atención especializada', status: 'COMPLETADO', statusColor: 'bg-orange-100 text-orange-700' },
    { turn: 'V-040', doc: '1.085.118.112', type: 'Víctima', typeDetails: '--', duration: '--', obs: '--', status: 'NO ASISTIÓ', statusColor: 'bg-red-100 text-red-700' },
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

export default function DashboardVictimas({ auth }) {
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
                type: 'Víctima',
                typeDetails: activeTurn.service,
                duration: elapsed,
                obs: observaciones || '--',
                status: estado,
                statusColor: estado === 'COMPLETADO' ? 'bg-orange-100 text-orange-700' : (estado === 'NO ASISTIÓ' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700')
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

    const handleNoAsistio = () => {
        avanzaTurnoAnimate('NO ASISTIÓ');
    };

    useEffect(() => {
        if (steps.consultoria && !steps.cierre && !timerRunning && !isPaused && !showSuccessAnim) {
            startTimer();
        } else if ((!steps.consultoria || steps.cierre || isPaused || showSuccessAnim) && timerRunning) {
            stopTimer();
        }
    }, [steps.consultoria, steps.cierre, timerRunning, isPaused, showSuccessAnim]);

    const handleStepAuto = (key) => {
        const order = ['llamado', 'checkin', 'consultoria', 'cierre'];
        const idx = order.indexOf(key);
        setSteps(current => {
            const next = { ...current };
            for(let i=0; i<=idx; i++) {
                if(!next[order[i]]) next[order[i]] = nowTime();
            }
            return next;
        });
    };

    const handleStep = (key) => {
        if (steps[key]) return;
        handleStepAuto(key);
    };

    useEffect(() => {
        if (activeTurn && !steps.llamado && !isPaused) {
            const t = setTimeout(() => handleStepAuto('llamado'), 400);
            return () => clearTimeout(t);
        }
    }, [activeTurn, steps.llamado, isPaused]);

    useEffect(() => {
        if (observaciones.length > 0 && !steps.consultoria) {
            handleStepAuto('consultoria');
        }
    }, [observaciones, steps.consultoria]);

    const disableNoAsistio = !!steps.checkin || !steps.llamado || isPaused || showSuccessAnim;
    const disableDescansoBtn = !!steps.llamado && !steps.cierre || showSuccessAnim;
    const disableFinalizar = !steps.consultoria || showSuccessAnim;

    const handleFinalizar = () => {
        if (!steps.cierre) {
            handleStepAuto('cierre');
        }
        setShowSuccessAnim(true);
        stopTimer();
        
        setTimeout(() => {
            avanzaTurnoAnimate('COMPLETADO');
            setShowSuccessAnim(false);
        }, 2200);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F6F9] font-['Inter',sans-serif] text-gray-800 overflow-hidden" style={{ fontSize: 'clamp(14px, 1vw, 18px)' }}>
            <Head><title>Control Center Víctimas | SENA APE</title></Head>

            {/* HEADER - Cambiado a Naranja */}
            <header className="h-[5.5rem] bg-white shadow-sm flex items-center justify-between px-8 shrink-0 relative z-10 w-full">
                <div className="flex items-center gap-6">
                    <img src="/logo-ape.png" alt="SENA APE" className="h-12 object-contain" />
                    <div className="hidden sm:block border-l-2 border-gray-200 pl-6">
                        <p className="text-orange-900 font-black text-base leading-none">SENA APE</p>
                        <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mt-1">Control Víctimas</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Link href={route('logout')} method="post" as="button" className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Cerrar Sesión">
                        <LogOut size={24} />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-lg font-black shadow-md">
                            {user?.name?.charAt(0).toUpperCase() || 'V'}
                        </div>
                        <div className="hidden sm:block text-right">
                            <p className="text-base font-bold text-gray-800 leading-none">{user?.name || 'Asesor Víctimas'}</p>
                            <p className="text-xs text-orange-500 mt-1 font-bold uppercase tracking-widest">Especialista</p>
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
                                                <h3 className="text-[clamp(1.5rem,2.5vw,2.5rem)] font-black text-gray-800 leading-none mb-1">{item.turn}</h3>
                                                <p className="text-[clamp(1rem,1.2vw,1.2rem)] font-bold text-gray-600 font-mono tracking-wider">{item.docType}: {item.doc}</p>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-xl ${item.typeColor} text-white flex flex-col items-center justify-center min-w-[100px] text-center`}>
                                                <span className="text-[10px] font-bold leading-tight uppercase">Víctima</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <div>
                                                <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">En espera: {item.timeWait}</p>
                                            </div>
                                            <div className="flex flex-col items-center text-orange-200">
                                                <Heart size={22} fill="currentColor" />
                                                <span className="text-[10px] font-bold mt-1 text-center leading-none uppercase">Población</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {queueItems.length === 0 && (
                                <div className="text-center py-10 opacity-50">
                                    <CheckCircle2 size={48} className="mx-auto mb-4 text-orange-200" />
                                    <p className="font-bold text-xl text-gray-500">Sin víctimas en fila</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA 2: Atención Actual */}
                    <div className="lg:col-span-6 flex flex-col gap-5 relative">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">Atención Actual</h2>

                        <AnimatePresence mode="wait">
                            {activeTurn ? (
                                <motion.div 
                                    layoutId={activeTurn.id} 
                                    key={activeTurn.id}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                                    className="bg-white border-2 border-gray-100 rounded-3xl p-8 2xl:p-12 shadow-xl shadow-orange-900/5 relative z-10 flex flex-col min-h-[600px] overflow-hidden">
                                    
                                    <AnimatePresence>
                                        {showSuccessAnim && (
                                            <motion.div 
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
                                                <div style={{ width: 300, height: 300 }}>
                                                    <DotLottiePlayer src="/success.lottie" autoplay loop={false} />
                                                </div>
                                                <h2 className="text-4xl font-black text-orange-900 mt-4 tracking-tight">Atención Exitosa</h2>
                                                <p className="text-gray-500 font-bold mt-2">Guardando historial de víctima...</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Header Atención */}
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Turno Actual</p>
                                            <h1 className="text-[clamp(4rem,6vw,6rem)] font-black text-orange-900 leading-none mb-4">{activeTurn.turn}</h1>
                                            <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl text-lg font-bold shadow-inner ${timerRunning ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                <span className="text-2xl tracking-widest">{elapsed}</span> <span className="text-xs tracking-normal mb-0.5">MIN</span>
                                            </div>
                                        </div>
                                        <div className="text-left border-l-2 border-gray-100 pl-8 2xl:pl-12">
                                            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Documento de Identidad</p>
                                            <h2 className="text-[clamp(2rem,3.5vw,3.5rem)] font-black text-orange-900 tracking-tight mb-4 flex">{activeTurn.doc}</h2>
                                            <h3 className="text-[clamp(1.2rem,1.8vw,1.8rem)] font-bold text-orange-600 tracking-tight uppercase">POBLACIÓN VÍCTIMA</h3>
                                        </div>
                                    </div>

                                    {/* Progreso */}
                                    <div className="my-8">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5">Progreso de la Atención</p>
                                        <div className="relative flex justify-between items-center w-full px-2">
                                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 -translate-y-1/2 mx-16"></div>
                                            
                                            {STEP_DEFS.map((step, i) => {
                                                const done = !!steps[step.key];
                                                const order = ['llamado','checkin','consultoria','cierre'];
                                                const isActive = steps[order[i]] && (!order[i+1] || !steps[order[i+1]]);

                                                return (
                                                    <motion.button
                                                        key={step.key}
                                                        onClick={() => handleStep(step.key)}
                                                        disabled={done || isPaused}
                                                        animate={{ scale: isActive ? 1.05 : 1 }}
                                                        className={`relative py-3 2xl:py-4 px-6 2xl:px-8 rounded-full border-2 flex items-center gap-3 text-lg font-semibold transition-colors shadow-sm bg-white
                                                            ${done && !isActive ? 'text-gray-500 border-gray-200' : ''}
                                                            ${isActive ? 'border-orange-500 text-orange-900 shadow-xl ring-2 ring-orange-500/30' : ''}
                                                            ${!done ? 'border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-600 cursor-pointer' : ''}
                                                        `}>
                                                        {done && !isActive ? (
                                                            <span className="bg-orange-500 text-white rounded-full p-1"><Check size={18} strokeWidth={4} /></span>
                                                        ) : isActive ? (
                                                            <span className="bg-orange-900 text-white rounded-full p-1.5 shadow-md flex items-center justify-center">
                                                                <step.Icon size={18} strokeWidth={2.5} />
                                                            </span>
                                                        ) : (
                                                            <span className="w-6 h-6 rounded-full border-[3px] border-current flex items-center justify-center text-xs font-black">{i + 1}</span>
                                                        )}
                                                        <span className="ml-1 text-sm">{step.label}</span>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    <div className="mt-auto flex flex-col pt-6">
                                        <label className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2 uppercase tracking-widest">
                                            <Edit3 size={18} /> Observaciones de la Atención
                                        </label>
                                        <textarea 
                                            className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-base text-gray-700 min-h-[120px] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none shadow-sm"
                                            placeholder="Detalles de la asesoría..."
                                            value={observaciones}
                                            onChange={(e) => setObservaciones(e.target.value)}
                                            readOnly={isPaused || !activeTurn}
                                        ></textarea>
                                        
                                        <button 
                                            onClick={handleFinalizar}
                                            disabled={disableFinalizar}
                                            className={`w-full mt-6 py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-lg group text-lg tracking-widest
                                                ${disableFinalizar ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-orange-700 hover:scale-[1.02] text-white'}`}>
                                            <ClipboardList size={26} /> 
                                            <span>FINALIZAR ATENCIÓN VÍCTIMA</span> 
                                            <ArrowRight size={26} className="group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="bg-white border-2 border-gray-100 rounded-3xl p-12 flex flex-col items-center justify-center h-full min-h-[600px]">
                                    <CheckCircle2 size={64} className="text-orange-500 mb-6" />
                                    <h2 className="text-4xl font-black text-gray-800">No hay víctimas activas</h2>
                                    <p className="text-gray-500 text-lg mt-2">Esperando al siguiente turno.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* COLUMNA 3: Comandos */}
                    <div className="lg:col-span-3 flex flex-col gap-5">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 tracking-tight">Comandos</h2>
                        <div className="flex flex-col gap-4">
                            <button onClick={handleNoAsistio} disabled={disableNoAsistio}
                                className={`w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all border-2
                                    ${disableNoAsistio ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white hover:bg-red-50 text-red-600 border-red-200 shadow-md transform hover:-translate-y-1'}`}>
                                <Ban size={26} /> NO ASISTIÓ
                            </button>
                            <button onClick={() => setIsPaused(!isPaused)} disabled={disableDescansoBtn}
                                className={`w-full py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all border-2
                                    ${disableDescansoBtn ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : isPaused ? 'bg-orange-50 text-orange-600 border-orange-300' : 'bg-white hover:bg-orange-50 text-orange-500 border-orange-200 shadow-md hover:-translate-y-1'}`}>
                                <Clock size={26} /> {isPaused ? 'REANUDAR' : 'DESCANSO'}
                            </button>
                        </div>
                        
                        <div className="mt-8 bg-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-900/20">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Hoy</p>
                                <Heart size={20} className="opacity-40" />
                            </div>
                            <h4 className="text-4xl font-black leading-none">{historyItems.length + 12}</h4>
                            <p className="text-xs font-bold mt-2 uppercase tracking-widest opacity-80">Víctimas Atendidas</p>
                        </div>
                    </div>
                </div>

                {/* HISTORIAL INFERIOR - IDÉNTICO AL ASESOR */}
                <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden mt-8 flex-shrink-0">
                    <div className="px-8 py-6 border-b-2 border-gray-100">
                        <h2 className="font-bold text-gray-800 text-2xl tracking-tight">Historial Especializado</h2>
                    </div>
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap">
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
                                        <motion.tr key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="py-5 px-8 font-black text-gray-800 text-lg">{row.turn}</td>
                                            <td className="py-5 px-8 text-xl font-bold font-mono text-gray-800 tracking-wider">{row.doc}</td>
                                            <td className="py-5 px-8">
                                                <span className="text-xs font-black uppercase px-3 py-1 rounded-lg bg-orange-100 text-orange-700">Víctima</span>
                                            </td>
                                            <td className="py-5 px-8 text-base font-semibold text-gray-700">{row.duration}</td>
                                            <td className="py-5 px-8 text-sm text-gray-500 max-w-[280px] truncate">{row.obs}</td>
                                            <td className="py-5 px-8">
                                                <span className={`text-xs font-black uppercase px-4 py-1.5 rounded-xl ${row.statusColor}`}>{row.status}</span>
                                            </td>
                                            <td className="py-5 px-8 text-right">
                                                <button className="text-orange-500 hover:text-orange-700 font-black flex items-center gap-1 justify-end ml-auto group">
                                                    <span className="text-xs uppercase tracking-widest">Detalle</span> <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
