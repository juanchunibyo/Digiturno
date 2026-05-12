import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LogOut, Timer, ChevronRight, Ban, CheckCircle2, AlertTriangle,
    ClipboardList, Clock, PhoneCall, UserCheck, MessageSquare, XCircle, 
    PauseCircle, Check, Edit3, ArrowRight, User, Users, FileText, Zap
} from 'lucide-react';
import { DotLottiePlayer } from '@dotlottie/react-player';

// --- Mapeo de Colores ---
const getTipoStyles = (tipo) => {
    const t = tipo?.toLowerCase() || '';
    if (t.includes('priorit') || t.includes('víctima')) return { 
        bg: 'bg-red-500', text: 'text-white', lightBg: 'bg-red-50', border: 'border-red-500', textColor: 'text-red-500' 
    };
    if (t.includes('empresa')) return { 
        bg: 'bg-blue-600', text: 'text-white', lightBg: 'bg-blue-50', border: 'border-blue-600', textColor: 'text-blue-600' 
    };
    if (t.includes('interna') || t.includes('sena')) return { 
        bg: 'bg-green-600', text: 'text-white', lightBg: 'bg-green-50', border: 'border-green-600', textColor: 'text-green-600' 
    };
    return { 
        bg: 'bg-slate-700', text: 'text-white', lightBg: 'bg-slate-50', border: 'border-slate-700', textColor: 'text-slate-700' 
    };
};

const STEP_DEFS = [
    { id: 1, key: 'llamado', label: 'Llamado', Icon: PhoneCall },
    { id: 2, key: 'checkin', label: 'Check-in', Icon: UserCheck },
    { id: 3, key: 'consultoria', label: 'Consultoría', Icon: MessageSquare },
    { id: 4, key: 'cierre', label: 'Cierre', Icon: XCircle },
];

export default function Dashboard() {
    const { auth, turnosEnEspera, atencionActiva, statsHoy, asesor, mensajeCoordinador, descansoActivo } = usePage().props;
    const user = auth.user;
    
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);
    const [activeTurn, setActiveTurn] = useState(atencionActiva ? {
        id: atencionActiva.id,
        turn: atencionActiva.turno_numero,
        doc: atencionActiva.documento,
        type: atencionActiva.tipo
    } : null);
    const [queueItems, setQueueItems] = useState(turnosEnEspera || []);
    const [currentStep, setCurrentStep] = useState(atencionActiva ? 'checkin' : 'llamado');
    const [observaciones, setObservaciones] = useState(atencionActiva?.observaciones || '');
    const [callCount, setCallCount] = useState(0);
    const [showSuccessAnim, setShowSuccessAnim] = useState(false);
    const [notificacionAsignacion, setNotificacionAsignacion] = useState(false);
    const [notificacionRetiro, setNotificacionRetiro] = useState(false);
    const [ultimaAtencionNotificada, setUltimaAtencionNotificada] = useState(atencionActiva?.id);





    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'danger' // 'danger' | 'warning'
    });
    const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, isOpen: false }));

    // Reiniciar conteo cuando cambia el turno
    useEffect(() => {
        setCallCount(0);
    }, [activeTurn?.id]);

    useEffect(() => {
        let id;
        if (currentStep === 'consultoria') {
            id = setInterval(() => setSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(id);
    }, [currentStep]);

    // Lógica de Re-Llamado Automático (cada 7s si está en paso 'llamado')
    useEffect(() => {
        let recallTimer;
        if (activeTurn && currentStep === 'llamado') {
            if (callCount >= 4) { // 1 llamada inicial + 4 rellamados = 5 llamados máximos
                router.post(route('asesor.finalizar'), { 
                    observaciones: 'Sistema: Cancelado automáticamente tras 5 llamados sin respuesta.',
                    estado: 'No Asistió' 
                }, {
                    onSuccess: () => {
                        setCallCount(0);
                        setSeconds(0);
                        setActiveTurn(null);
                        setRunning(false);
                        setObservaciones('');
                        setCurrentStep('llamado');
                    }
                });
            } else {
                recallTimer = setInterval(() => {
                    router.post(route('asesor.rellamar'), { atencion_id: activeTurn.id }, {
                        preserveScroll: true,
                        preserveState: true,
                    });
                    setCallCount(prev => prev + 1);
                }, 5000); // 5 segundos
            }
        }
        return () => clearInterval(recallTimer);
    }, [activeTurn, currentStep, callCount]);

    // Polling constante para actualizar "last_activity" y detectar asignaciones
    useEffect(() => {
        const interval = setInterval(() => {
            // Heartbeat silencioso para mantener estado Online
            fetch('/api/asesor/heartbeat', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content } });

            // Recargamos datos de la atención y la cola. 
            // Si hay un turno activo, solo actualizamos estadísticas y cola.
            router.reload({ 
                only: ['atencionActiva', 'turnosEnEspera', 'statsHoy', 'mensajeCoordinador'],
                preserveScroll: true,
                preserveState: true
            });
        }, 5000); // Cada 5 segundos para mantener el "Online" fluido
        return () => clearInterval(interval);
    }, []);

    // Sincronizar estado cuando llega una atención desde el servidor (Auto o Coordinador)
    useEffect(() => {
        if (atencionActiva) {
            setActiveTurn({
                id: atencionActiva.id,
                turn: atencionActiva.turno_numero,
                doc: atencionActiva.documento,
                type: atencionActiva.tipo
            });
            
            // Si el estado es 'Llamando', el paso es 'llamado'
            // Si el estado es 'En Curso', el paso es 'consultoria'
            if (atencionActiva.estado === 'Llamando') {
                setCurrentStep('llamado');
                setRunning(false); // El cronómetro no corre en llamado
            } else if (atencionActiva.estado === 'En Curso') {
                setCurrentStep('consultoria');
                setRunning(true); // El cronómetro corre en consultoría
            }
        } else {
            setActiveTurn(null);
            setRunning(false);
            setCurrentStep('llamado');
            setSeconds(0);
        }
    }, [atencionActiva]);

    // Notificar cambios de asignación (Nuevos o Retiros)
    useEffect(() => {
        // 1. Nueva Asignación
        if (atencionActiva && atencionActiva.id !== ultimaAtencionNotificada) {
            const chime = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            chime.volume = 0.6;
            chime.play().catch(e => console.log("Audio play blocked"));
            
            setNotificacionAsignacion(true);
            setNotificacionRetiro(false);
            setUltimaAtencionNotificada(atencionActiva.id);
            setTimeout(() => setNotificacionAsignacion(false), 5000);
        } 
        
        // 2. Retiro de Turno (Desaparece de props pero el asesor no lo terminó)
        else if (!atencionActiva && ultimaAtencionNotificada && !showSuccessAnim) {
            // Sonido de alerta de retiro (más grave o diferente)
            const alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            alertSound.volume = 0.5;
            alertSound.play().catch(e => console.log("Audio play blocked"));

            setNotificacionRetiro(true);
            setNotificacionAsignacion(false);
            setUltimaAtencionNotificada(null);
            setTimeout(() => setNotificacionRetiro(false), 5000);
        }
        
        else if (!atencionActiva) {
            setUltimaAtencionNotificada(null);
        }
    }, [atencionActiva]);

    // Sincronizar cola de espera con los datos del servidor (Polling)
    useEffect(() => {
        setQueueItems(turnosEnEspera || []);
    }, [turnosEnEspera]);

    const handleCheckIn = () => {
        router.post(route('asesor.checkin'), { atencion_id: activeTurn.id }, {
            onSuccess: () => {
                setCurrentStep('consultoria');
                setRunning(true);
            }
        });
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleLlamar = (item) => {
        router.post(route('asesor.llamar'), { turno_id: item.id }, {
            onSuccess: () => {
                setActiveTurn(item);
                setQueueItems(prev => prev.filter(i => i.id !== item.id));
                setCurrentStep('checkin');
                setRunning(true);
            }
        });
    };

    const handleFinalizar = () => {
        if (!observaciones.trim()) {
            // Mostrar alerta de error temporal (opcional) usando un flash local o alert
            alert("Por favor, ingrese las observaciones antes de finalizar la atención.");
            return;
        }

        setShowSuccessAnim(true);
        
        // Simular un pequeño delay para que se aprecie la animación (estilo Nequi)
        setTimeout(() => {
            router.post(route('asesor.finalizar'), { 
                observaciones,
                estado: 'Completado' 
            }, {
                onSuccess: () => {
                    setSeconds(0);
                    setActiveTurn(null);
                    setRunning(false);
                    setObservaciones('');
                    setCurrentStep('llamado');
                    setShowSuccessAnim(false);
                },
                onError: () => {
                    setShowSuccessAnim(false);
                }
            });
        }, 1500);
    };

    const handleNoAsistioManual = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Marcar como No Asistió',
            message: '¿Seguro que desea marcar este turno como "No Asistió" manualmente? Esto liberará tu módulo de inmediato.',
            type: 'danger',
            onConfirm: () => {
                router.post(route('asesor.finalizar'), { 
                    observaciones: 'Cancelado manualmente por el asesor (No se presentó en el módulo).',
                    estado: 'No Asistió' 
                }, {
                    onSuccess: () => {
                        setCallCount(0);
                        setSeconds(0);
                        setActiveTurn(null);
                        setRunning(false);
                        setObservaciones('');
                        setCurrentStep('llamado');
                        closeConfirm();
                    }
                });
            }
        });
    };

    const handleCancelarAtencion = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Cancelar Atención',
            message: '¿Desea cancelar esta atención en curso? Esta acción no se puede deshacer y el turno quedará como cancelado.',
            type: 'warning',
            onConfirm: () => {
                router.post(route('asesor.finalizar'), { 
                    observaciones: observaciones || 'Atención cancelada por el asesor.',
                    estado: 'Cancelado' 
                }, {
                    onSuccess: () => {
                        setSeconds(0);
                        setActiveTurn(null);
                        setRunning(false);
                        setObservaciones('');
                        setCurrentStep('llamado');
                        closeConfirm();
                    }
                });
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#F0F2F5] text-[#2D3748] font-['Inter',sans-serif] flex flex-col">
            <Head title="Panel de Asesor | SENA APE" />

            <AnimatePresence>
                {usePage().props.flash?.error && (
                    <motion.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20"
                    >
                        <div className="bg-white/20 p-2 rounded-full">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-widest text-xs opacity-80">Error de Validación</p>
                            <p className="text-lg font-bold">{usePage().props.flash.error}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notificación de Nueva Asignación */}
            <AnimatePresence>
                {notificacionAsignacion && activeTurn && (
                    <motion.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-[#39A900] text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20"
                    >
                        <div className="bg-white/20 p-2 rounded-full animate-bounce">
                            <Zap size={24} />
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-widest text-xs opacity-80">¡Nueva Asignación!</p>
                            <p className="text-lg font-bold">Te han asignado el turno: <span className="text-yellow-300 font-black">{activeTurn.turn}</span></p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notificación de Turno Retirado/Re-asignado */}
            <AnimatePresence>
                {notificacionRetiro && (
                    <motion.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 20, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-orange-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20"
                    >
                        <div className="bg-white/20 p-2 rounded-full animate-pulse">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-widest text-xs opacity-80">Turno Retirado</p>
                            <p className="text-lg font-bold">El coordinador ha re-asignado tu turno actual.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Encabezado Superior Oscuro/Institucional */}
            <header className="h-20 bg-[#1e293b] border-b-4 border-[#39A900] flex items-center justify-between px-8 shadow-xl shrink-0 relative z-20">
                <div className="flex items-center gap-6">
                    <div className="bg-white p-2 rounded-xl">
                        <img src="/logo-ape.png" alt="SENA" className="h-8" />
                    </div>
                    <div className="border-l border-gray-600 h-8 mx-2" />
                    <div>
                        <h1 className="text-[14px] font-black text-white uppercase tracking-widest leading-none">SENA APE</h1>
                        <p className="text-[11px] font-bold text-[#39A900] uppercase tracking-tight">Panel Operativo de Asesor</p>
                    </div>
                </div>

                    <div className="flex items-center gap-6">
                        <Link href={route('logout')} method="post" as="button" className="text-gray-400 hover:text-red-400 transition-colors bg-white/5 p-2 rounded-lg">
                            <LogOut size={20} />
                        </Link>
                        <div className="flex items-center gap-4 bg-white/10 p-2 pr-6 rounded-full border border-white/10">
                            <div className="w-10 h-10 rounded-full bg-[#39A900] text-white flex items-center justify-center text-sm font-black shadow-lg ring-2 ring-[#39A900]/50">
                                {user?.name?.charAt(0).toUpperCase() || 'F'}
                            </div>
                            <div className="text-left">
                                <p className="text-[13px] font-black text-white leading-none">{user?.name || 'Usuario'}</p>
                                <p className="text-[10px] text-[#39A900] font-bold mt-1 uppercase tracking-wider bg-[#39A900]/20 inline-block px-2 py-0.5 rounded-md">{asesor?.taquilla || 'Sin Módulo'}</p>
                            </div>
                        </div>
                    </div>
            </header>
            {/* PANTALLA DE AVISO CRÍTICO DEL COORDINADOR (FA-01) */}
            <AnimatePresence>
                {mensajeCoordinador && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-red-600/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6"
                    >
                        {/* Patrón de fondo sutil */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        
                        <motion.div 
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="bg-white rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10 flex flex-col items-center text-center p-12"
                        >
                            <div className="w-28 h-28 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8 animate-pulse">
                                <AlertTriangle size={60} strokeWidth={2.5} />
                            </div>

                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">
                                ¡AVISO DEL COORDINADOR!
                            </h2>
                            
                            <div className="w-20 h-1.5 bg-red-600 rounded-full mb-8"></div>

                            <p className="text-2xl font-bold text-slate-600 leading-relaxed mb-12 italic">
                                "{mensajeCoordinador}"
                            </p>

                            <button 
                                onClick={() => router.post(route('asesor.limpiar-mensaje'))}
                                className="w-full h-20 bg-slate-900 hover:bg-black text-white rounded-3xl font-black text-lg uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-4 group"
                            >
                                <CheckCircle2 className="group-hover:scale-125 transition-transform" />
                                Entendido, Volver al Trabajo
                            </button>
                            
                            <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                Esta pantalla se cerrará al confirmar la lectura
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* CONTENIDO PRINCIPAL */}
            {descansoActivo ? (
                <main className="flex-1 p-8 flex flex-col items-center justify-center relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-gray-100 p-20 text-center relative overflow-hidden max-w-3xl w-full"
                    >
                        <div className="absolute top-0 left-0 w-full h-4 bg-blue-500"></div>
                        
                        <div className="w-40 h-40 bg-blue-50 text-blue-600 rounded-[3rem] flex items-center justify-center mb-12 shadow-inner mx-auto relative">
                            <PauseCircle size={80} strokeWidth={1.5} />
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="absolute inset-0 bg-blue-400 rounded-full blur-2xl -z-10"
                            />
                        </div>

                        <h2 className="text-6xl font-black text-slate-800 tracking-tighter mb-12 uppercase leading-none">
                            Módulo <span className="text-blue-600">En Pausa</span>
                        </h2>
                        
                        <p className="text-2xl font-bold text-slate-400 mb-16 max-w-md mx-auto leading-relaxed">
                            Has pausado tu atención. Tu módulo se encuentra inactivo para el sistema.
                        </p>

                        <button 
                            onClick={() => router.post(route('asesor.finalizar-descanso'))}
                            className="w-full h-24 bg-slate-900 hover:bg-black text-white rounded-[2rem] font-black text-2xl uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-6 group"
                        >
                            <Zap size={32} className="text-[#39A900] group-hover:scale-125 transition-transform" /> 
                            Volver a Atender
                        </button>

                        <p className="mt-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
                            Presione el botón para reanudar la recepción de turnos
                        </p>
                    </motion.div>
                </main>
            ) : (
                <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto relative z-10 custom-scrollbar">
                <div className="grid grid-cols-12 gap-6 min-h-[550px] shrink-0">
                {/* Panel Izquierdo: Lista de Espera (Columna pequeña 3/12) */}
                <aside className="col-span-12 lg:col-span-3 flex flex-col h-full overflow-hidden">
                    <div className="bg-white rounded-2xl shadow-xl flex flex-col h-full border border-gray-200 overflow-hidden">
                        <div className="bg-[#1e293b] p-5 border-b-4 border-gray-700">
                            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <Users size={20} className="text-[#39A900]" />
                                Turnos en Espera
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">Siguiente en la cola de atención</p>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 custom-scrollbar">
                            <AnimatePresence mode='popLayout'>
                            {(queueItems || []).map((item, idx) => {
                                const styles = getTipoStyles(item.type || item.tipo);
                                return (
                                    <motion.div 
                                        key={item.id}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -50, opacity: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`rounded-xl p-5 border-l-8 shadow-sm relative group hover:shadow-md transition-all cursor-default ${styles.lightBg} ${styles.border}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-800 tracking-tighter leading-none">{item.turn || '---'}</h3>
                                                <span className={`inline-block mt-2 px-2 py-1 text-[9px] font-black rounded-md uppercase tracking-widest ${styles.bg} ${styles.text}`}>
                                                    {item.type || item.tipo}
                                                </span>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${styles.bg} animate-pulse shadow-md`} />
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tighter">ID: {item.doc}</p>
                                            <div className="text-[10px] text-gray-500 font-black uppercase tracking-tighter flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200">
                                                En espera
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        </div>
                    </div>
                </aside>

                <section className="col-span-12 lg:col-span-6 flex flex-col h-full">
                    <div className="bg-white rounded-2xl shadow-xl flex flex-col h-full border border-gray-200 overflow-hidden">
                        <div className="bg-white p-5 border-b border-gray-200 flex items-center justify-between z-10 shadow-sm">
                            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                                Atención Actual
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">En Línea</span>
                            </div>
                        </div>
                        <div className="p-8 flex flex-col h-full bg-gray-50/50 relative">
                        <AnimatePresence mode="wait">
                            {activeTurn ? (
                                <motion.div 
                                    key="active"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="flex flex-col h-full"
                                >
                                    {/* Header de Color para el Turno */}
                                    <div className={`-mx-8 -mt-8 mb-10 p-8 flex justify-between items-center text-white ${getTipoStyles(activeTurn.type).bg} shadow-lg relative overflow-hidden rounded-b-3xl border-b-4 ${getTipoStyles(activeTurn.type).border} brightness-95`}>
                                        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                                        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                                            <User size={180} className="transform translate-x-1/4 translate-y-1/4" />
                                        </div>
                                        <div className="flex items-center gap-6 relative z-10">
                                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-5xl font-black shadow-inner ring-4 ring-white/30">
                                                {activeTurn.turn || '---'}
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 bg-black/20 inline-block px-3 py-1 rounded-md">ID: {activeTurn.doc}</p>
                                                <h1 className="text-3xl font-black tracking-tight uppercase drop-shadow-md">{activeTurn.type}</h1>
                                            </div>
                                        </div>
                                        <div className="text-right relative z-10 bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                                            <div className="flex items-center gap-3 justify-end">
                                                <Timer size={28} className="animate-pulse text-[#5ceb00]" />
                                                <span className="text-5xl font-black font-mono tracking-tighter drop-shadow-md">
                                                    {formatTime(seconds)}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-gray-300 mt-2">Tiempo de Atención</p>
                                        </div>
                                    </div>

                                    <div className="mb-6 overflow-x-auto pb-4">
                                        <div className="flex items-center justify-between relative min-w-[500px] px-2">
                                            <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-100 z-0" />
                                            {STEP_DEFS.map((step, idx) => {
                                                const isActive = currentStep === step.key;
                                                const isCompleted = STEP_DEFS.findIndex(s => s.key === currentStep) > idx;
                                                return (
                                                    <div key={step.key} onClick={() => setCurrentStep(step.key)} className="relative z-10 flex items-center gap-3 bg-white px-4 cursor-pointer group">
                                                        <motion.div 
                                                            animate={{ 
                                                                scale: isActive ? 1.2 : 1,
                                                                backgroundColor: isActive || isCompleted ? '#39A900' : '#F1F5F9',
                                                                color: isActive || isCompleted ? '#FFFFFF' : '#94A3B8',
                                                                borderColor: isActive || isCompleted ? '#39A900' : '#CBD5E1'
                                                            }}
                                                            className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-md z-20 relative"
                                                        >
                                                            {isCompleted ? <Check size={20} /> : <step.Icon size={20} />}
                                                            {isActive && step.key === 'llamado' && (
                                                                <motion.div 
                                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                >
                                                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                                                </motion.div>
                                                            )}
                                                        </motion.div>
                                                        <div className="flex flex-col mt-1">
                                                            <span className={`text-[10px] font-black uppercase ${isActive ? 'text-[#39A900]' : 'text-gray-400'} leading-none tracking-widest`}>Paso {step.id}</span>
                                                            <span className={`text-[13px] font-black uppercase tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-6 flex-1 flex flex-col">
                                        <div className="space-y-3 relative z-10 flex-1 flex flex-col">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Observaciones de la Atención</label>
                                            <textarea 
                                                value={observaciones} onChange={e => setObservaciones(e.target.value)}
                                                className="w-full flex-1 bg-gray-50/50 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-6 text-sm text-gray-700 min-h-[140px] focus:ring-4 focus:ring-green-500/10 focus:border-[#39A900] outline-none transition-all resize-none shadow-inner hover:border-gray-200"
                                                placeholder="Registre aquí los detalles y conclusiones de la atención..."
                                            />
                                        </div>
                                        {currentStep === 'llamado' ? (
                                            <motion.button 
                                                animate={{ 
                                                    x: [0, -2, 2, -2, 2, 0],
                                                    scale: [1, 1.05, 1],
                                                    boxShadow: [
                                                        '0px 0px 0px rgba(57,169,0,0)', 
                                                        '0px 10px 40px rgba(57,169,0,0.6)', 
                                                        '0px 0px 0px rgba(57,169,0,0)'
                                                    ] 
                                                }}
                                                transition={{ 
                                                    repeat: Infinity, 
                                                    duration: 0.5,
                                                    times: [0, 0.1, 0.2, 0.3, 0.4, 0.5]
                                                }}
                                                whileHover={{ scale: 1.08 }}
                                                whileTap={{ scale: 0.95, rotate: -5 }}
                                                onClick={handleCheckIn} 
                                                className="w-full py-5 bg-[#39A900] text-white font-black text-sm rounded-2xl shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 uppercase tracking-widest border border-[#4ade80]"
                                            >
                                                Llamando al Usuario... ({callCount + 1}/5) 
                                                <motion.div
                                                    animate={{ rotate: [-20, 20, -20] }}
                                                    transition={{ repeat: Infinity, duration: 0.2 }}
                                                >
                                                    <PhoneCall size={22} />
                                                </motion.div>
                                            </motion.button>
                                        ) : (
                                            <div className="flex flex-col gap-4">
                                                <motion.button 
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    disabled={(currentStep !== 'consultoria' && currentStep !== 'cierre') || !observaciones.trim()}
                                                    onClick={handleFinalizar} 
                                                    className={`w-full py-5 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all uppercase tracking-widest ${
                                                        (currentStep === 'consultoria' || currentStep === 'cierre') && observaciones.trim() ? 'bg-[#F97316] hover:bg-[#EA580C] shadow-orange-500/20' : 'bg-gray-300 shadow-none cursor-not-allowed opacity-50'
                                                    }`}
                                                >
                                                    {observaciones.trim() ? 'Finalizar y Archivar Atención' : 'Escriba observaciones para finalizar'} <ArrowRight size={18} />
                                                </motion.button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="waiting"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex-1 flex flex-col items-center justify-center text-gray-400 relative z-10 py-20"
                                >
                                    <div className="relative mb-8 w-64 h-64 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-[#39A900]/10 rounded-full blur-3xl animate-pulse"></div>
                                        <DotLottiePlayer
                                            src="/loading.lottie"
                                            background="transparent"
                                            speed="1"
                                            style={{ width: '100%', height: '100%' }}
                                            loop
                                            autoplay
                                        />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-widest mb-2">ESPERANDO TURNOS</h3>
                                    <p className="text-md font-bold text-gray-500">Listo para recibir un nuevo ciudadano en este módulo</p>
                                    <div className="mt-10 flex gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-200">
                                        <div className="w-3 h-3 rounded-full bg-[#39A900] animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-3 h-3 rounded-full bg-[#39A900] animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-3 h-3 rounded-full bg-[#39A900] animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        </div>
                    </div>
                </section>

                <section className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 relative overflow-hidden space-y-4">
                        <div className="absolute right-0 top-0 w-2 h-full bg-blue-500"></div>
                        <h2 className="text-lg font-black text-gray-800 tracking-tight border-b border-gray-100 pb-2">Control Operativo</h2>
                        <div className="space-y-3 relative z-10 pt-2">
                            {/* Flujo Alternativo: Solo aparece si hay un turno activo */}
                            <AnimatePresence>
                                {activeTurn && currentStep === 'llamado' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <button 
                                            onClick={handleNoAsistioManual}
                                            className="w-full py-4 border-2 border-red-500 bg-red-50 text-red-600 font-black text-xs rounded-xl flex items-center justify-center gap-3 uppercase tracking-widest hover:bg-red-100 transition-all shadow-md mb-4"
                                        >
                                            <XCircle size={18} /> No se presentó
                                        </button>
                                        <div className="h-[1px] bg-gray-100 my-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button 
                                disabled={currentStep !== 'cierre'}
                                onClick={() => router.post(route('asesor.finalizar'), {
                                    estado: 'Completado',
                                    observaciones: observaciones || 'Atención completada (Tomó Descanso)',
                                    tomar_descanso: true
                                }, {
                                    onSuccess: () => {
                                        setSeconds(0);
                                        setActiveTurn(null);
                                        setRunning(false);
                                        setObservaciones('');
                                        setCurrentStep('llamado');
                                    }
                                })}
                                className={`w-full py-4 border-2 font-black text-xs rounded-xl flex items-center justify-center gap-3 uppercase tracking-widest transition-all ${
                                    currentStep === 'cierre' ? 'bg-blue-50 border-blue-500 text-blue-600 hover:bg-blue-100 shadow-md' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <PauseCircle size={18} /> Tomar Descanso
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 relative overflow-hidden space-y-4">
                        <div className="absolute right-0 top-0 w-2 h-full bg-[#39A900]"></div>
                        <h2 className="text-lg font-black text-gray-800 tracking-tight border-b border-gray-100 pb-2">Estadísticas</h2>
                        <div className="grid grid-cols-3 gap-3 relative z-10 pt-2">
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex flex-col items-center text-center shadow-sm overflow-hidden">
                                <span className="text-lg font-black text-orange-600 truncate w-full">{Math.round(statsHoy?.maxDescanso || 0)}m</span>
                                <span className="text-[9px] font-black text-orange-600 uppercase mt-1">Max Descanso</span>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex flex-col items-center text-center shadow-sm overflow-hidden">
                                <span className="text-lg font-black text-purple-700 truncate w-full">{Math.round(statsHoy?.total || 0)}</span>
                                <span className="text-[9px] font-black text-purple-700 uppercase mt-1">Hoy</span>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col items-center text-center shadow-sm overflow-hidden">
                                <span className="text-lg font-black text-blue-600 truncate w-full">{Math.round(statsHoy?.promedio || 0)}m</span>
                                <span className="text-[9px] font-black text-blue-600 uppercase mt-1">Promedio</span>
                            </div>
                        </div>
                    </div>

                </section>
                </div>

                {/* TABLA DE HISTORIAL EN LA PARTE INFERIOR */}
                <section className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden shrink-0 mt-4">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                            <ClipboardList size={24} className="text-purple-600" />
                            Historial de Atenciones (Hoy)
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b-2 border-gray-100">
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Turno</th>
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Documento</th>
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Tipo</th>
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Inicio / Fin</th>
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest">Estado</th>
                                    <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-widest w-1/4">Observaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {(usePage().props.historialAsesor || []).map((h, idx) => (
                                    <motion.tr 
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="hover:bg-gray-50 transition-colors group"
                                    >
                                        <td className="p-4">
                                            <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 group-hover:border-[#39A900] group-hover:bg-green-50 transition-all">{h.turn}</span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-600">{h.doc}</td>
                                        <td className="p-4 text-sm font-black text-gray-700">{h.type}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-[#39A900] uppercase tracking-tighter">Inicio: {h.inicio}</span>
                                                <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">Fin: {h.fin}</span>
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter mt-1 bg-blue-50 px-1 rounded-sm w-fit">Duración: {h.duration}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md ${
                                                h.status === 'COMPLETADO' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                                            }`}>
                                                {h.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 font-medium">
                                            {h.obs}
                                        </td>
                                    </motion.tr>
                                ))}
                                {(!usePage().props.historialAsesor || usePage().props.historialAsesor.length === 0) && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-gray-400 italic text-sm font-bold uppercase tracking-widest">
                                            Sin atenciones finalizadas el día de hoy
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
            )}
            {/* MODAL DE CONFIRMACIÓN PREMIUM */}
            <AnimatePresence>
                {confirmConfig.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
                            onClick={closeConfirm} 
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.9, y: 20, opacity: 0 }} 
                            animate={{ scale: 1, y: 0, opacity: 1 }} 
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-10 text-center"
                        >
                            <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${
                                confirmConfig.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                            }`}>
                                <AlertTriangle size={40} strokeWidth={2.5} />
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 mb-4">{confirmConfig.title}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10">
                                {confirmConfig.message}
                            </p>

                            <div className="flex gap-4">
                                <button 
                                    onClick={closeConfirm}
                                    className="flex-1 h-16 bg-slate-100 text-slate-500 font-black text-xs rounded-2xl uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmConfig.onConfirm}
                                    className={`flex-[1.5] h-16 text-white font-black text-xs rounded-2xl uppercase tracking-[0.2em] shadow-lg transition-all hover:scale-105 ${
                                        confirmConfig.type === 'danger' ? 'bg-red-500 shadow-red-200' : 'bg-amber-500 shadow-amber-200'
                                    }`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
            `}} />
            {/* ANIMACIÓN DE ÉXITO (ESTILO NEQUI) */}
            <AnimatePresence>
                {showSuccessAnim && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
                    >
                        <div className="w-64 h-64 mb-6">
                            <DotLottiePlayer
                                src="/success_blue.lottie"
                                background="transparent"
                                speed="1.2"
                                style={{ width: '100%', height: '100%' }}
                                autoplay
                            />
                        </div>
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-2xl font-black text-[#39A900] uppercase tracking-widest"
                        >
                            ¡Atención Finalizada!
                        </motion.h2>
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-gray-500 font-bold mt-2"
                        >
                            Archivando historial y observaciones...
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
