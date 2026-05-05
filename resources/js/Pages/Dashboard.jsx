import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LogOut, Timer, ChevronRight, Ban, CheckCircle2, AlertTriangle,
    ClipboardList, Clock, PhoneCall, UserCheck, MessageSquare, XCircle, 
    PauseCircle, Check, Edit3, ArrowRight, User, Users, FileText, Zap
} from 'lucide-react';

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
    const { auth, turnosEnEspera, atencionActiva, statsHoy, asesor, mensajeCoordinador } = usePage().props;
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

    // Reiniciar conteo cuando cambia el turno
    useEffect(() => {
        setCallCount(0);
    }, [activeTurn?.id]);

    useEffect(() => {
        let id;
        if (running && currentStep === 'consultoria') {
            id = setInterval(() => setSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(id);
    }, [running, currentStep]);

    // Lógica de Re-Llamado Automático (cada 15s si está en paso 'llamado')
    useEffect(() => {
        let recallTimer;
        if (activeTurn && currentStep === 'llamado') {
            if (callCount >= 9) { // 1 llamada inicial + 9 rellamados = 10 llamados máximos
                router.post(route('asesor.finalizar'), { 
                    observaciones: 'Sistema: Cancelado automáticamente tras 10 llamados sin respuesta.',
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
                }, 15000); // 15 segundos
            }
        }
        return () => clearInterval(recallTimer);
    }, [activeTurn, currentStep, callCount]);

    // Polling constante para actualizar "last_activity" y detectar asignaciones
    useEffect(() => {
        const interval = setInterval(() => {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F0F4F8] via-white to-[#E6FFFA] text-[#2D3748] font-['Inter',sans-serif] flex flex-col">
            <Head title="SENA APE Control Center" />

            <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm shrink-0">
                <div className="flex items-center gap-6">
                    <img src="/logo-ape.png" alt="SENA" className="h-10" />
                    <div className="border-l border-gray-200 h-8 mx-2" />
                    <div>
                        <h1 className="text-[12px] font-black text-[#39A900] uppercase tracking-widest leading-none">SENA APE</h1>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">Control Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Link href={route('logout')} method="post" as="button" className="text-gray-400 hover:text-red-500 transition-colors">
                        <LogOut size={20} />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#39A900] text-white flex items-center justify-center text-sm font-black shadow-md">
                            {user?.name?.charAt(0).toUpperCase() || 'F'}
                        </div>
                        <div className="text-right">
                            <p className="text-[12px] font-black text-gray-800 leading-none">{user?.name || 'Usuario'}</p>
                            <p className="text-[10px] text-[#39A900] font-bold mt-1 uppercase tracking-wider">{asesor?.taquilla || 'Sin Módulo'}</p>
                        </div>
                    </div>
                </div>
            </header>
            <AnimatePresence>
                {mensajeCoordinador && (
                    <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="mx-8 mt-6 p-4 bg-gradient-to-r from-[#39A900] to-[#2D8000] text-white rounded-2xl shadow-lg flex items-center justify-between gap-4 border border-white/20 relative overflow-hidden"
                    >
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Instrucción del Coordinador</p>
                                <p className="text-sm font-bold tracking-tight">{mensajeCoordinador}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => router.post(route('asesor.limpiar-mensaje'))}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors relative z-10"
                        >
                            <Check size={20} />
                        </button>
                        <motion.div 
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 p-6 grid grid-cols-12 gap-8 overflow-hidden">
                <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
                    <h2 className="text-xl font-black text-[#1A202C] mb-2 tracking-tight flex items-center gap-2">
                        <Users size={20} className="text-[#39A900]" />
                        En Espera
                    </h2>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
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
                                                <h3 className="text-2xl font-black text-gray-800 tracking-tighter leading-none">{item.turn}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{item.type || item.tipo}</p>
                                            </div>
                                            <div className={`w-3 h-3 rounded-full ${styles.bg} animate-pulse`} />
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ID: {item.doc}</p>
                                            <div className="text-[10px] text-[#39A900] font-black uppercase tracking-tighter flex items-center gap-1">
                                                En espera
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </aside>

                <section className="col-span-12 lg:col-span-6 flex flex-col gap-4">
                    <h2 className="text-xl font-black text-[#1A202C] mb-2 tracking-tight">Atención Actual</h2>
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 flex flex-col h-full relative overflow-hidden">
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
                                    <div className={`-mx-10 -mt-10 mb-10 p-8 flex justify-between items-center text-white ${getTipoStyles(activeTurn.type).bg} shadow-lg`}>
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl font-black shadow-inner ring-1 ring-white/30">
                                                {activeTurn.turn}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Documento: {activeTurn.doc}</p>
                                                <h1 className="text-2xl font-black tracking-tight uppercase">{activeTurn.type}</h1>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-3 justify-end">
                                                <Timer size={24} className="animate-pulse" />
                                                <span className="text-4xl font-black font-mono tracking-tighter drop-shadow-md">
                                                    {formatTime(seconds)}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-1">Cronómetro Activo</p>
                                        </div>
                                    </div>

                                    <div className="mb-12 overflow-x-auto pb-4">
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
                                                                backgroundColor: isActive || isCompleted ? '#39A900' : '#FFFFFF',
                                                                color: isActive || isCompleted ? '#FFFFFF' : '#CBD5E1',
                                                                borderColor: isActive || isCompleted ? '#39A900' : '#E2E8F0'
                                                            }}
                                                            className="w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all shadow-sm"
                                                        >
                                                            {isCompleted ? <Check size={20} /> : <step.Icon size={20} />}
                                                            {isActive && (
                                                                <motion.div 
                                                                    layoutId="step-glow"
                                                                    className="absolute inset-0 rounded-full bg-[#39A900]/20 -z-10"
                                                                    animate={step.key === 'llamado' ? { 
                                                                        scale: [1, 1.6, 1],
                                                                        opacity: [0.5, 0.2, 0.5]
                                                                    } : { scale: [1, 1.4, 1] }}
                                                                    transition={step.key === 'llamado' ? { 
                                                                        repeat: 4, // 4 veces como pidió el usuario
                                                                        duration: 1,
                                                                        repeatDelay: 0.2
                                                                    } : { repeat: Infinity, duration: 2 }}
                                                                />
                                                            )}
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
                                                        <div className="flex flex-col">
                                                            <span className={`text-[9px] font-bold ${isActive ? 'text-[#39A900]' : 'text-gray-400'} leading-none`}>({step.id})</span>
                                                            <span className={`text-[12px] font-black uppercase tracking-tight ${isActive ? 'text-gray-900' : 'text-gray-300'}`}>{step.label}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Observaciones de la Atención</label>
                                            <textarea 
                                                value={observaciones} onChange={e => setObservaciones(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-700 min-h-[140px] focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all resize-none shadow-inner"
                                                placeholder="Ingrese aquí los detalles y conclusiones..."
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
                                                Llamando al Usuario... ({callCount + 1}/10) 
                                                <motion.div
                                                    animate={{ rotate: [-20, 20, -20] }}
                                                    transition={{ repeat: Infinity, duration: 0.2 }}
                                                >
                                                    <PhoneCall size={22} />
                                                </motion.div>
                                            </motion.button>
                                        ) : (
                                            <motion.button 
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={currentStep !== 'consultoria' && currentStep !== 'cierre'}
                                                onClick={handleFinalizar} 
                                                className={`w-full py-5 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all uppercase tracking-widest ${
                                                    (currentStep === 'consultoria' || currentStep === 'cierre') ? 'bg-[#F97316] hover:bg-[#EA580C] shadow-orange-500/20' : 'bg-gray-300 shadow-none cursor-not-allowed opacity-50'
                                                }`}
                                            >
                                                Finalizar y Archivar Atención <ArrowRight size={18} />
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="waiting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex-1 flex flex-col items-center justify-center text-gray-200"
                                >
                                    <Zap size={80} strokeWidth={1} className="animate-bounce" />
                                    <p className="mt-4 font-black uppercase tracking-widest">Esperando nuevo turno</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                <section className="col-span-12 lg:col-span-3 flex flex-col gap-8">
                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-[#1A202C] tracking-tight">Control Operativo</h2>
                        <div className="space-y-3">
                            <button 
                                disabled={currentStep !== 'cierre'}
                                className={`w-full py-4 border font-black text-xs rounded-xl flex items-center justify-center gap-3 uppercase tracking-widest transition-all ${
                                    currentStep === 'cierre' ? 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50' : 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                }`}
                            >
                                <PauseCircle size={18} /> Tomar Descanso
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-xl font-black text-[#1A202C] tracking-tight">Estadísticas</h2>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col items-center text-center">
                                <span className="text-lg font-black text-blue-600">{statsHoy?.promedio || 0}m</span>
                                <span className="text-[8px] font-black text-blue-400 uppercase mt-1">Promedio</span>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col items-center text-center">
                                <span className="text-lg font-black text-[#39A900]">ACT</span>
                                <span className="text-[8px] font-black text-green-400 uppercase mt-1">Estado</span>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-sm flex flex-col items-center text-center">
                                <span className="text-lg font-black text-purple-600">{statsHoy?.total || 0}</span>
                                <span className="text-[8px] font-black text-purple-400 uppercase mt-1">Hoy</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <h2 className="text-xl font-black text-[#1A202C] tracking-tight mb-4 flex items-center gap-2">
                            <ClipboardList size={20} className="text-[#39A900]" />
                            Historial Reciente
                        </h2>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {(usePage().props.historialAsesor || []).map((h, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white p-4 rounded-xl border border-gray-50 shadow-sm group hover:border-green-100 transition-all"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-black text-gray-800">{h.turn}</span>
                                        <button className="p-1.5 text-gray-300 hover:text-[#39A900] transition-colors" title="Enviar Reporte">
                                            <FileText size={14} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400">ID: {h.doc}</p>
                                            <p className="text-[8px] text-gray-400 uppercase mt-0.5">{h.time}</p>
                                        </div>
                                        <span className="text-[9px] font-black text-[#39A900] uppercase tracking-tighter">{h.status}</span>
                                    </div>
                                </motion.div>
                            ))}
                            {(!usePage().props.historialAsesor || usePage().props.historialAsesor.length === 0) && (
                                <div className="text-center py-8 text-gray-300 italic text-xs font-bold uppercase tracking-widest">Sin atenciones hoy</div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
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
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 15 } }}
                            className="w-32 h-32 bg-[#39A900] rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50 mb-6"
                        >
                            <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                <motion.path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M5 13l4 4L19 7" 
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                                />
                            </svg>
                        </motion.div>
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
