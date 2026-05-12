import React, { useState, useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Clock, AlertTriangle, Monitor, LogOut, 
    Activity, CheckCircle, User, Settings, BarChart,
    ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, 
    ChevronRight, ChevronDown, Calendar, Filter, Search, MessageSquare, 
    UserPlus, Eye, FileText, Download, Briefcase, TrendingUp,
    LayoutDashboard, PieChart, Shield, Bell, Zap, XCircle, Coffee, BarChart3
} from 'lucide-react';

// Componente para mini-gráficas de líneas (Sparklines)
const Sparkline = ({ data, color }) => {
    const points = data.map((val, i) => `${(i * 100) / (data.length - 1)},${100 - val}`).join(' ');
    return (
        <svg viewBox="0 0 100 100" className="w-24 h-12 overflow-visible">
            <defs>
                <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
                    <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
                </linearGradient>
            </defs>
            <motion.polyline fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" points={points} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }} />
            <path d={`M 0 100 L ${points} L 100 100 Z`} fill={`url(#grad-${color})`} opacity="0.5" />
        </svg>
    );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-8 py-5 transition-all duration-300 border-l-4 ${active ? 'bg-gradient-to-r from-[#39A900]/5 to-transparent border-[#39A900] text-[#39A900]' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
        <Icon size={20} className={`${active ? 'text-[#39A900]' : 'text-slate-400'}`} />
        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
);

export default function CoordinadorDashboard({ auth, flash, kpis: initialKpis, asesoresData: initialAsesores, ciudadanosEnEspera: initialEspera }) {
    const dashboardRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedAsesorMsg, setSelectedAsesorMsg] = useState(null);
    const [selectedAsesorId, setSelectedAsesorId] = useState(null);
    const [msgContent, setMsgContent] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [reportFilters, setReportFilters] = useState({
        fecha: new Date().toISOString().split('T')[0],
        modulo: '',
        search: ''
    });

    const [kpis, setKpis] = useState(initialKpis);
    const [asesores, setAsesores] = useState(initialAsesores || []);
    const [ciudadanosEnEspera, setCiudadanosEnEspera] = useState(initialEspera || []);
    const [historialHoyAsesor, setHistorialHoyAsesor] = useState([]);
    const [toast, setToast] = useState(null);
    const [reportPeriod, setReportPeriod] = useState('mensual'); // 'hoy' o 'mensual'
    const [isProcessingAssignment, setIsProcessingAssignment] = useState(false);

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const calculateTime = (startTime) => {
        if (!startTime) return '--:--';
        const start = new Date(startTime).getTime();
        const diff = Math.max(0, Math.floor((now.getTime() - start) / 1000));
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const selectedAsesorView = useMemo(() => {
        return asesores.find(a => a.id === selectedAsesorId);
    }, [selectedAsesorId, asesores]);

    useEffect(() => {
        setKpis(initialKpis);
        setAsesores(initialAsesores || []);
        setCiudadanosEnEspera(initialEspera || []);
    }, [initialKpis, initialAsesores, initialEspera]);

    useGSAP(() => {
        // Animación de las filas de la tabla
        gsap.from(".table-row", {
            x: -20,
            opacity: 0, 
            duration: 0.6,
            stagger: 0.05,
            ease: "power2.out",
            delay: 0.2
        });

        // Respiración del badge EN VIVO
        gsap.to(".live-badge", {
            opacity: 0.5,
            repeat: -1,
            yoyo: true,
            duration: 1.5,
            ease: "sine.inOut"
        });
    }, { scope: dashboardRef, dependencies: [] });

    // Animación del Modal cuando se abre
    useGSAP(() => {
        if (selectedAsesorId && selectedAsesorView) {
            const tl = gsap.timeline();
            tl.from(".modal-header", { y: -50, opacity: 0, duration: 0.6, ease: "back.out(1.7)" })
              .from(".modal-section", { y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" }, "-=0.3")
              .from(".modal-footer", { opacity: 0, duration: 0.4 }, "-=0.2");
        }
    }, [selectedAsesorId]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchData = () => {
            fetch(`/api/coordinador/datos?periodo=${reportPeriod}`)
                .then(res => res.json())
                .then(data => {
                    setKpis(data.kpis);
                    setAsesores(data.asesoresData);
                    setCiudadanosEnEspera(data.ciudadanosEnEspera);
                });
        };
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [reportPeriod]);

    // Eliminado fetch separado: ahora el historial viene en selectedAsesorView.atenciones_historial

    useEffect(() => {
        if (flash?.error) setToast({ type: 'error', message: flash.error });
        if (flash?.success) setToast({ type: 'success', message: flash.success });
        if (flash) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const handleAsignar = (turnoId, asesorId) => {
        router.post(route('coordinador.asignar'), { turno_id: turnoId, asesor_id: asesorId }, { preserveScroll: true });
    };

    const handleAsignarPuesto = (asesorId, modulo, jornada) => {
        setIsProcessingAssignment(true);
        router.post(route('coordinador.asignar-puesto'), { asesor_id: asesorId, modulo, jornada }, { 
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsProcessingAssignment(false)
        });
    };

    const handleDesasignarPuesto = (asesorId) => {
        setIsProcessingAssignment(true);
        router.post(route('coordinador.desasignar-puesto'), { asesor_id: asesorId }, { 
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setIsProcessingAssignment(false)
        });
    };

    const handleEnviarMensaje = () => {
        if (!msgContent.trim()) return;
        router.post(route('coordinador.enviar-mensaje'), { asesor_id: selectedAsesorMsg.id, mensaje: msgContent }, {
            onSuccess: () => { setSelectedAsesorMsg(null); setMsgContent(''); },
            preserveScroll: true
        });
    };

    const handleToggleVictimas = (asesorId) => {
        router.post(route('coordinador.toggle-victimas'), { asesor_id: asesorId }, { preserveScroll: true });
    };

    const [visibleFlash, setVisibleFlash] = useState({ success: null, error: null });

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setVisibleFlash({ success: flash.success, error: flash.error });
            const timer = setTimeout(() => {
                setVisibleFlash({ success: null, error: null });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const formatMMSS = (seconds) => {
        if (!seconds || isNaN(seconds)) return '--:--';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div ref={dashboardRef} className="flex h-screen bg-[#F1F5F9] font-['Inter',sans-serif] text-slate-800 overflow-hidden select-none">
            <Head><title>SENA APE | Centro de Comando</title></Head>

            {/* Alertas de Sistema (Flash) */}
            <AnimatePresence>
                {visibleFlash.error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 z-[9999]"
                    >
                        <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-red-500/30 flex items-center gap-3 border border-red-400/20 backdrop-blur-md">
                            <AlertTriangle size={20} className="text-red-100" />
                            <p className="font-black text-sm tracking-tight">{visibleFlash.error}</p>
                        </div>
                    </motion.div>
                )}
                {visibleFlash.success && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="fixed top-6 right-6 z-[9999]"
                    >
                        <div className="bg-[#39A900] text-white px-6 py-4 rounded-2xl shadow-2xl shadow-[#39A900]/30 flex items-center gap-3 border border-white/20 backdrop-blur-md">
                            <CheckCircle size={20} className="text-[#39A900]/20 fill-white" />
                            <p className="font-black text-sm tracking-tight">{visibleFlash.success}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* SIDEBAR */}
            <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col z-50">
                <div className="p-10"><img src="/logo-ape.png" alt="SENA APE" className="h-16 object-contain" /></div>
                <div className="flex-1 mt-4">
                    <SidebarItem icon={LayoutDashboard} label="DASHBOARD" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <SidebarItem icon={Monitor} label="GESTIÓN DE MÓDULOS" active={activeTab === 'modulos'} onClick={() => setActiveTab('modulos')} />
                    <SidebarItem icon={PieChart} label="REPORTES" active={activeTab === 'reportes'} onClick={() => setActiveTab('reportes')} />
                </div>

                <div className="p-8">
                    <Link href="/logout" method="post" as="button" className="w-full py-4 bg-white text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-red-100 hover:bg-red-50 transition-all shadow-sm">
                        Cerrar Sesión
                    </Link>
                </div>
            </aside>

            <main className="flex-1 flex flex-col relative overflow-hidden">
                <header className="h-24 bg-white border-b border-slate-200/60 flex items-center justify-between px-12 shrink-0 z-40 sticky top-0">
                    <div className="flex items-center gap-6">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
                            Centro de Comando Digital <div className="live-badge px-3 py-1 bg-[#39A900]/10 text-[#39A900] text-[9px] rounded-full uppercase font-black tracking-widest border border-[#39A900]/20">EN VIVO</div>
                        </h2>
                    </div>
                    <div className="flex items-center gap-12">
                        <div className="flex flex-col text-right tabular-nums">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hora Local</span>
                            <span className="text-lg font-black text-slate-800 uppercase">{currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col text-right">
                                <span className="text-sm font-black text-slate-900 leading-none uppercase">{auth?.user?.name || 'COORDINADOR'}</span>
                                <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">COORDINADOR APE</span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-xl uppercase">
                                {auth?.user?.name ? auth.user.name.charAt(0) : 'C'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 lg:p-14 space-y-12 custom-scrollbar">
                    <AnimatePresence mode='wait'>
                        {activeTab === 'dashboard' && (
                            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 text-left">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    {[
                                        { label: 'Atenciones ' + (reportPeriod === 'semanal' ? 'Semana' : 'Hoy'), value: kpis.atencionesHoy || 0, color: '#39A900', data: [30, 45, 32, 50, 48, 65, 70], icon: CheckCircle },
                                        { label: 'Promedio ' + (reportPeriod === 'semanal' ? 'Semana' : 'Atención'), value: (kpis.tiempoPromedio || 0) + 'm', color: '#00324D', data: [12, 10, 15, 8, 11, 9, 7], icon: Clock },
                                        { title: 'Asesores Activos', value: kpis.asesoresActivos || 0, trend: 'Estable', icon: Users, color: '#0ea5e9', data: [2, 3, 2, 4, 3, 4, 4] },
                                        { title: 'Tiempo Promedio', value: `${kpis.tiempoPromedio || 0}m`, trend: '-2m', icon: BarChart, color: '#6366f1', data: [12, 11, 13, 10, 12, 11, 10] }
                                    ].map((kpi, idx) => (
                                        <div key={idx} className="kpi-card bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-500">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="p-4 rounded-2xl bg-slate-50" style={{ color: kpi.color }}><kpi.icon size={24} /></div>
                                                <span className="text-[10px] font-black text-slate-400">{kpi.trend}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title || kpi.label}</p>
                                            <div className="flex items-end justify-between gap-4 mt-2">
                                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{kpi.value}</h3>
                                                <Sparkline data={kpi.data} color={kpi.color} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                                    <div className="xl:col-span-3 bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden pb-10">
                                        <div className="p-10 border-b border-slate-50 bg-white">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                                <div>
                                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                                        <BarChart3 className="text-[#39A900]" size={32} /> 
                                                        Reporte de Rendimiento {reportPeriod === 'mensual' ? 'Mensual' : 'Diario'}
                                                    </h3>
                                                    <p className="text-slate-400 font-medium mt-1">Monitorea la productividad de tu equipo en tiempo real</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-[#39A900]/60"><RefreshCw size={14} className="animate-spin" /><span className="text-[9px] font-black uppercase tracking-widest">Actualización en tiempo real</span></div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="bg-white">
                                                    <tr>
                                                        <th className="px-10 py-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Asesor / Módulo</th>
                                                        <th className="px-8 py-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">Estado Actual</th>
                                                        <th className="px-8 py-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">Atención</th>
                                                        <th className="px-8 py-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">Descanso</th>
                                                        <th className="px-8 py-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">Atendidos</th>
                                                        <th className="px-10 py-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-center">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {asesores.map(a => (
                                                        <tr key={a.id} className={`hover:bg-slate-50 transition-colors group ${a.alert_inactividad ? 'bg-red-50/30' : ''}`}>
                                                            <td className="px-10 py-8">
                                                                <div className="flex items-center gap-6">
                                                                    <div className="relative">
                                                                        <div className="w-20 h-16 rounded-[2rem] bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400">{a.avatar}</div>
                                                                        <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-white ${a.status !== 'OFFLINE' ? 'bg-[#39A900]' : 'bg-slate-300'}`} />
                                                                        {a.alertas_count > 0 && (
                                                                            <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white animate-bounce">{a.alertas_count}</div>
                                                                        )}
                                                                    </div>
                                                                    <div><p className="font-black text-slate-900 text-lg uppercase tracking-tight">{a.name}</p><div className="flex items-center gap-2 mt-1"><Monitor size={12} className="text-slate-300" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{a.box}</span></div></div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-8 text-center">
                                                                <div className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl border font-black text-[10px] uppercase tracking-widest shadow-sm ${
                                                                    a.status === 'ATENDIENDO' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                                    a.status === 'LLAMANDO' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                    a.status === 'DISPONIBLE' ? 'bg-[#39A900]/10 text-[#39A900] border-[#39A900]/20' :
                                                                    a.status === 'DESCANSO' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                                                                    'bg-slate-50 text-slate-400 border-slate-100'
                                                                }`}>
                                                                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                                                                        a.status === 'ATENDIENDO' ? 'bg-blue-500' :
                                                                        a.status === 'LLAMANDO' ? 'bg-amber-500' :
                                                                        a.status === 'DISPONIBLE' ? 'bg-[#39A900]' :
                                                                        a.status === 'DESCANSO' ? 'bg-orange-500' : 'bg-slate-400'
                                                                    }`} />
                                                                    {a.status}
                                                                </div>
                                                                {a.alert_inactividad && <div className="mt-2 text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1"><AlertTriangle size={10} /> Demora: {a.inactivity_time}m</div>}
                                                            </td>
                                                            <td className="px-8 py-8 text-center font-black text-2xl tracking-tighter tabular-nums text-slate-900">{a.status === 'ATENDIENDO' ? calculateTime(a.start_time) : '--:--'}</td>
                                                            <td className="px-8 py-8 text-center font-black text-2xl tracking-tighter tabular-nums text-orange-500">{a.status === 'DESCANSO' ? calculateTime(a.start_time) : '--:--'}</td>
                                                            <td className="px-8 py-8 text-center">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-3xl font-black text-[#39A900] tracking-tighter tabular-nums">
                                                                        {a.atenciones_count || 0}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-8 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button onClick={() => setSelectedAsesorId(a.id)} className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-[#39A900] transition-all shadow-lg"><Eye size={18} /></button>
                                                                    <button onClick={() => setSelectedAsesorMsg(a)} className="h-12 w-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm"><MessageSquare size={18} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 rounded-[3.5rem] shadow-2xl p-10 text-white flex flex-col relative overflow-hidden h-full min-h-[500px]">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#39A900]/10 rounded-full blur-[100px]" />
                                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-4 mb-10 relative z-10"><Users className="text-[#39A900]" /> Cola de Espera</h3>
                                        <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[700px]">
                                            {ciudadanosEnEspera.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-48 opacity-20">
                                                    <Clock size={40} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest mt-4">Sin turnos en espera</p>
                                                </div>
                                            ) : ciudadanosEnEspera.map(item => (
                                                <div key={item.id} className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] flex flex-col gap-4 hover:bg-white/10 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black shadow-lg transition-transform group-hover:scale-110 ${item.alert ? 'bg-red-500' : 'bg-gradient-to-br from-[#39A900] to-[#1B4332]'}`}>{item.turn}</div>
                                                        <div className="text-left min-w-0 flex-1">
                                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest truncate">{item.type}</p>
                                                            <p className="font-black text-green-400 text-xs tabular-nums mt-1">{item.waitTime}</p>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <select 
                                                            onChange={(e) => handleAsignar(item.id, e.target.value)} 
                                                            className="w-full bg-white/10 border border-white/20 text-[9px] font-black uppercase rounded-xl px-4 py-3 pr-10 outline-none cursor-pointer hover:bg-white hover:text-black transition-all appearance-none"
                                                        >
                                                            <option value="" disabled className="bg-slate-900">Asignar a Asesor</option>
                                                            {asesores.filter(a => a.status === 'DISPONIBLE').map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.name.toUpperCase()}</option>)}
                                                        </select>
                                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none group-hover:text-black transition-colors" size={14} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'modulos' && (
                            <motion.div key="modulos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                                <h2 className="text-5xl font-black text-slate-900 tracking-tighter text-left">Gestión de <span className="text-[#39A900]">Módulos</span></h2>
                                <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden pb-8">
                                    <div className="grid grid-cols-12 bg-slate-900 text-white p-10 items-center">
                                        <div className="col-span-4 px-8 text-[10px] font-black uppercase tracking-widest opacity-40 text-left">Asesores</div>
                                        <div className="col-span-4 px-8 flex items-center gap-4 text-orange-400 font-black uppercase tracking-widest text-[10px]"><Zap size={20} /> Jornada Mañana</div>
                                        <div className="col-span-4 px-8 flex items-center gap-4 text-indigo-400 font-black uppercase tracking-widest text-[10px]"><Clock size={20} /> Jornada Tarde</div>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {asesores.map(a => (
                                            <div key={a.id} className="grid grid-cols-12 items-center hover:bg-slate-50 transition-colors">
                                                <div className="col-span-4 p-12 flex items-center gap-8">
                                                    <div className="w-16 h-16 rounded-[1.8rem] bg-slate-100 flex items-center justify-center font-black text-xl text-slate-400">{a.avatar}</div>
                                                    <div className="text-left"><p className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">{a.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-2">{a.box || 'Sin puesto'}</p></div>
                                                </div>
                                                <div className="col-span-4 p-12 bg-orange-50/5 border-x border-slate-50 flex gap-2">
                                                    <select 
                                                        disabled={isProcessingAssignment}
                                                        className={`flex-1 h-16 rounded-2xl px-6 text-[11px] font-black border-2 transition-all ${a.jornada === 'MAÑANA' ? 'border-orange-200 bg-white shadow-xl shadow-orange-100 text-orange-700' : 'border-slate-100 bg-slate-50/50'} ${isProcessingAssignment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                                                        value={a.jornada === 'MAÑANA' ? a.box : ''} 
                                                        onChange={(e) => handleAsignarPuesto(a.id, e.target.value, 'MAÑANA')}
                                                    >
                                                        <option value="">LIBRE</option>
                                                        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => <option key={n} value={`MODULO ${String(n).padStart(2, '0')}`}>MODULO {String(n).padStart(2, '0')}</option>)}
                                                    </select>
                                                    {a.jornada === 'MAÑANA' && <button disabled={isProcessingAssignment} onClick={() => handleDesasignarPuesto(a.id)} className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"><XCircle size={20} /></button>}
                                                </div>
                                                <div className="col-span-4 p-12 bg-indigo-50/5 flex gap-2">
                                                    <select 
                                                        disabled={isProcessingAssignment}
                                                        className={`flex-1 h-16 rounded-2xl px-6 text-[11px] font-black border-2 transition-all ${a.jornada === 'TARDE' ? 'border-indigo-200 bg-white shadow-xl shadow-indigo-100 text-indigo-700' : 'border-slate-100 bg-slate-50/50'} ${isProcessingAssignment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                                                        value={a.jornada === 'TARDE' ? a.box : ''} 
                                                        onChange={(e) => handleAsignarPuesto(a.id, e.target.value, 'TARDE')}
                                                    >
                                                        <option value="">LIBRE</option>
                                                        {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => <option key={n} value={`MODULO ${String(n).padStart(2, '0')}`}>MODULO {String(n).padStart(2, '0')}</option>)}
                                                    </select>
                                                    {a.jornada === 'TARDE' && <button disabled={isProcessingAssignment} onClick={() => handleDesasignarPuesto(a.id)} className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"><XCircle size={20} /></button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'reportes' && (
                            <motion.div key="reportes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10 pb-20">
                                {/* Header Estilo Imagen */}
                                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-6">
                                        <button onClick={() => setActiveTab('dashboard')} className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all">
                                            <ArrowUpRight className="rotate-[-135deg]" size={24} />
                                        </button>
                                            <div className="flex flex-col">
                                                <h2 className="text-4xl font-black text-[#00324D] tracking-tighter flex items-center gap-4 italic uppercase">
                                                    Reporte {reportPeriod === 'mensual' ? 'Semanal' : 'Diario'}
                                                </h2>
                                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Resumen de Atenciones APE</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
                                            <button 
                                                onClick={() => setReportPeriod('hoy')}
                                                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${reportPeriod === 'hoy' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Hoy
                                            </button>
                                            <button 
                                                onClick={() => setReportPeriod('mensual')}
                                                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${reportPeriod === 'mensual' ? 'bg-[#39A900] text-white shadow-xl shadow-[#39A900]/20' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                Semana Actual
                                            </button>
                                        </div>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="relative group">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#39A900] transition-colors" size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="BUSCAR POR NOMBRE"
                                                className="h-16 pl-16 pr-8 rounded-2xl border-2 border-slate-100 focus:border-[#39A900] focus:ring-0 text-[11px] font-black uppercase tracking-widest w-64 transition-all"
                                                value={reportFilters.search}
                                                onChange={(e) => setReportFilters({...reportFilters, search: e.target.value})}
                                            />
                                        </div>

                                        <select 
                                            className="h-16 px-8 rounded-2xl border-2 border-slate-100 focus:border-[#39A900] focus:ring-0 text-[11px] font-black uppercase tracking-widest min-w-[300px] transition-all"
                                            value={selectedAsesorId || ''}
                                            onChange={(e) => setSelectedAsesorId(e.target.value ? parseInt(e.target.value) : null)}
                                        >
                                            <option value="">TODOS LOS ASESORES</option>
                                            {asesores.map(a => <option key={a.id} value={a.id}>{a.name.toUpperCase()} - {a.box}</option>)}
                                        </select>

                                        <button onClick={() => window.print()} className="h-16 px-10 bg-[#00324D] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#39A900] transition-all shadow-xl shadow-blue-900/20">
                                            Imprimir Reporte
                                        </button>
                                    </div>
                                </div>

                                {/* Tabla Matricial */}
                                <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-10 py-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Asesor</th>
                                                    <th className="px-6 py-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                                                    {reportPeriod === 'mensual' ? (
                                                        ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(d => (
                                                            <th key={d} className="px-4 py-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{d}</th>
                                                        ))
                                                    ) : (
                                                        <th className="px-4 py-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">Hoy</th>
                                                    )}
                                                    <th className="px-6 py-6 font-black text-xs text-slate-400 uppercase tracking-widest text-center">Atenciones</th>
                                                    <th className="px-6 py-6 font-black text-xs text-slate-400 uppercase tracking-widest text-center">Prom. Espera</th>
                                                    <th className="px-6 py-6 font-black text-xs text-slate-400 uppercase tracking-widest text-center">Prom. Aten</th>
                                                    <th className="px-6 py-6 font-black text-xs text-slate-400 uppercase tracking-widest text-center">Total Espera</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {asesores
                                                    .filter(a => a.name.toLowerCase().includes(reportFilters.search.toLowerCase()))
                                                    .filter(a => !selectedAsesorId || a.id === selectedAsesorId)
                                                    .map(a => (
                                                    <tr key={a.id} onClick={() => setSelectedAsesorId(a.id)} className={`group hover:bg-slate-50/50 transition-all cursor-pointer ${selectedAsesorId === a.id ? 'bg-[#39A900]/5' : ''}`}>
                                                        <td className="px-10 py-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-white transition-all shadow-sm">{a.avatar}</div>
                                                                <div>
                                                                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight leading-none">{a.name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest leading-none">{a.box}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-8 text-center">
                                                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${a.tipo_asesor === 'Víctimas' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-[#39A900]/10 text-[#39A900] border border-[#39A900]/20'}`}>
                                                                {a.tipo_asesor}
                                                            </span>
                                                        </td>
                                                        {reportPeriod === 'mensual' ? (
                                                            (a.weekly_breakdown || [0,0,0,0,0,0]).map((count, i) => (
                                                                <td key={i} className="px-4 py-8 text-center font-black text-slate-600 tabular-nums">{count}</td>
                                                            ))
                                                        ) : (
                                                            <td className="px-4 py-8 text-center font-black text-slate-600 tabular-nums">{a.turnos_atendidos}</td>
                                                        )}
                                                        <td className="px-6 py-8 text-center bg-slate-50/30 font-black text-slate-900">{a.turnos_atendidos}</td>
                                                        <td className="px-6 py-8 text-center font-black text-xs text-slate-900 tabular-nums">{a.promedio_espera}m</td>
                                                        <td className="px-6 py-8 text-center font-black text-xs text-slate-900 tabular-nums italic underline decoration-[#39A900]">{a.promedio_atencion}m</td>
                                                        <td className="px-6 py-8 text-center font-black text-xs text-slate-900 tabular-nums">{a.total_espera}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Detalle de Atenciones Estilo Imagen */}
                                {selectedAsesorView && (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className="bg-white rounded-[3.5rem] shadow-sm border-t-8 border-[#FFB700] overflow-hidden">
                                            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white">
                                                <div>
                                                    <h3 className="text-3xl font-black text-[#00324D] tracking-tight flex items-center gap-4 italic uppercase">Detalle de Atenciones</h3>
                                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Historial completo del asesor seleccionado</p>
                                                </div>
                                                <div className="px-8 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                    {historialHoyAsesor.length} Atenciones
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-50/30">
                                                            <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">Turno</th>
                                                            <th className="px-6 py-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tipo</th>
                                                            <th className="px-6 py-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Fecha y Hora (Inicio)</th>
                                                            <th className="px-6 py-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Espera del Usuario</th>
                                                            <th className="px-6 py-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Tiempo Asesor</th>
                                                            <th className="px-10 py-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {(selectedAsesorView.atenciones_historial || []).map((h, i) => (
                                                            <tr key={i} className="hover:bg-slate-50/50 transition-all">
                                                                <td className="px-10 py-6 font-black text-slate-900 text-lg tabular-nums italic">{h.turn}</td>
                                                                <td className="px-6 py-6 text-center">
                                                                    <span className="px-4 py-1 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest border border-slate-200">
                                                                        {h.type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-6 text-center text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                                                                    {h.inicio}
                                                                </td>
                                                                <td className="px-6 py-6 text-center font-black text-slate-900 tabular-nums">{formatMMSS(h.espera)}</td>
                                                                <td className="px-6 py-6 text-center font-black text-slate-900 tabular-nums underline decoration-[#00324D]">{formatMMSS(h.dur)}</td>
                                                                <td className="px-10 py-6 text-center">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${h.status === 'COMPLETADO' ? 'text-[#39A900]' : 'text-red-500'}`}>
                                                                        {h.status === 'COMPLETADO' ? 'ATENDIDO' : 'AUSENTE'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {historialHoyAsesor.length === 0 && (
                                                            <tr>
                                                                <td colSpan="6" className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">No hay atenciones registradas</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">Sistema de Gestión Institucional — APE Digiturno</p>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <AnimatePresence>
                {selectedAsesorId && selectedAsesorView && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setSelectedAsesorId(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-[3.5rem] w-full max-w-4xl overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative z-10 flex flex-col max-h-[85vh]">
                            
                            {/* MODAL HEADER: PROFILE & STATUS */}
                            <div className="modal-header p-12 pb-8 border-b border-slate-100 flex items-center justify-between gap-8 bg-white shrink-0">
                                <div className="flex items-center gap-8">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center text-4xl font-black shadow-2xl group-hover:scale-105 transition-transform duration-500 uppercase">{selectedAsesorView.avatar}</div>
                                        <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl border-4 border-white flex items-center justify-center shadow-lg ${selectedAsesorView.status !== 'OFFLINE' ? 'bg-[#39A900]' : 'bg-slate-300'}`}>
                                            <Activity size={16} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedAsesorView.name}</h3>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedAsesorView.box}</span>
                                            <span className="px-4 py-1.5 bg-blue-50 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">{selectedAsesorView.tipo_asesor}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 text-right shrink-0">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Servicio Especial</span>
                                    <button 
                                        onClick={() => handleToggleVictimas(selectedAsesorView.id)} 
                                        className={`flex items-center gap-3 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 border ${
                                            selectedAsesorView.tipo_asesor === 'Víctimas' 
                                            ? 'bg-orange-500 text-white border-orange-400 shadow-[0_10px_20px_-5px_rgba(249,115,22,0.4)]' 
                                            : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedAsesorView.tipo_asesor === 'Víctimas' ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                                        {selectedAsesorView.tipo_asesor === 'Víctimas' ? 'Víctimas Activo' : 'Víctimas Inactivo'}
                                    </button>
                                </div>
                            </div>

                            {/* MODAL BODY: TABS CONTENT (CENTERED GRID) */}
                            <div className="flex-1 overflow-y-auto p-12 bg-slate-50/30 custom-scrollbar">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    
                                    {/* SECCIÓN IZQUIERDA: HISTORIAL DE ATENCIONES (GRANDE) */}
                                    <div className="modal-section lg:col-span-2 space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3"><Activity size={14} className="text-[#39A900]" /> Historial de Atenciones (Hoy)</h4>
                                        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm flex-1">
                                            <table className="w-full text-[10px]">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-5 font-black uppercase text-slate-400 text-left">Turno</th>
                                                        <th className="px-6 py-5 font-black uppercase text-slate-400 text-center">Hora</th>
                                                        <th className="px-6 py-5 font-black uppercase text-slate-400 text-center">Duración</th>
                                                        <th className="px-6 py-5 font-black uppercase text-slate-400 text-right">Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {(selectedAsesorView.atenciones_historial || []).map((h, i) => (
                                                        <tr key={i} className="table-row hover:bg-slate-50/50 transition-all">
                                                            <td className="px-6 py-4 font-black text-slate-900">{h.turn} <span className="text-[8px] text-slate-400 ml-1 font-bold">{h.type}</span></td>
                                                            <td className="px-6 py-4 text-center text-slate-500 font-bold tabular-nums">{h.inicio}</td>
                                                            <td className="px-6 py-4 text-center text-slate-500 font-bold tabular-nums">{h.dur}</td>
                                                            <td className={`px-6 py-4 text-right font-black ${h.status === 'COMPLETADO' ? 'text-[#39A900]' : 'text-red-400'}`}>{h.status}</td>
                                                        </tr>
                                                    ))}
                                                    {(!selectedAsesorView.atenciones_historial || selectedAsesorView.atenciones_historial.length === 0) && <tr><td colSpan="4" className="py-20 text-center text-slate-300 font-black uppercase tracking-widest italic">Sin actividad</td></tr>}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* COLUMNA DERECHA: PAUSAS Y ALERTAS (STACKED) */}
                                    <div className="modal-section space-y-8">
                                        {/* HISTORIAL DE PAUSAS (COLOR MOSTAZA/NARANJA) */}
                                        <div className="flex flex-col gap-6 text-left">
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3"><Coffee size={14} className="text-amber-500" /> Historial de Pausas</h4>
                                            <div className="bg-amber-50/50 rounded-[2.5rem] border border-amber-100 overflow-hidden shadow-sm overflow-y-auto max-h-[300px] custom-scrollbar">
                                                <table className="w-full text-[10px]">
                                                    <thead className="bg-amber-100/50 sticky top-0 z-10">
                                                        <tr>
                                                            <th className="px-6 py-4 font-black uppercase text-amber-600/60 text-left">Inicio</th>
                                                            <th className="px-6 py-4 font-black uppercase text-amber-600/60 text-center">Fin</th>
                                                            <th className="px-6 py-4 font-black uppercase text-amber-600/60 text-right">Dur</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-amber-100">
                                                        {selectedAsesorView.breaks_history?.map((b, i) => (
                                                            <tr key={i} className="hover:bg-amber-100/30 transition-all">
                                                                <td className="px-6 py-4 font-black text-amber-700">{b.inicio}</td>
                                                                <td className="px-6 py-4 text-center font-black text-amber-700">{b.fin}</td>
                                                                <td className="px-6 py-4 text-right font-black text-amber-700 tabular-nums">{b.duracion_format}</td>
                                                            </tr>
                                                        ))}
                                                        {(!selectedAsesorView.breaks_history || selectedAsesorView.breaks_history.length === 0) && <tr><td colSpan="3" className="py-12 text-center text-amber-300 font-black uppercase tracking-widest text-[9px]">Sin pausas</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* ALERTAS */}
                                        <div className="flex flex-col gap-6 text-left">
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3"><AlertTriangle size={14} className="text-red-500" /> Alertas</h4>
                                            <div className="bg-red-50/50 rounded-[2.5rem] border border-red-100 overflow-hidden shadow-sm overflow-y-auto max-h-[300px] custom-scrollbar">
                                                <table className="w-full text-[10px]">
                                                    <thead className="bg-red-100/50 sticky top-0 z-10">
                                                        <tr>
                                                            <th className="px-6 py-4 font-black uppercase text-red-600/60 text-left">Tipo</th>
                                                            <th className="px-6 py-4 font-black uppercase text-red-600/60 text-right">Demora</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-red-100">
                                                        {selectedAsesorView.alertas_history?.map((al, i) => (
                                                            <tr key={i} className="hover:bg-red-100/30 transition-all">
                                                                <td className="px-6 py-4 font-black text-red-700 uppercase">{al.tipo}</td>
                                                                <td className="px-6 py-4 text-right font-black text-red-700 tabular-nums">{al.duracion} MIN</td>
                                                            </tr>
                                                        ))}
                                                        {(!selectedAsesorView.alertas_history || selectedAsesorView.alertas_history.length === 0) && <tr><td colSpan="2" className="py-12 text-center text-red-300 font-black uppercase tracking-widest text-[9px]">Sin alertas</td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MODAL FOOTER */}
                            <div className="modal-footer p-10 shrink-0 border-t border-slate-50 bg-slate-50/30">
                                <button onClick={() => setSelectedAsesorId(null)} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">Cerrar Monitor de Asesor</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL MENSAJE */}
            <AnimatePresence>
                {selectedAsesorMsg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedAsesorMsg(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-10 text-center">
                            <h3 className="text-2xl font-black text-slate-900 uppercase mb-2">Enviar Aviso</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Para: {selectedAsesorMsg.name}</p>
                            <textarea value={msgContent} onChange={(e) => setMsgContent(e.target.value)} placeholder="Escribe el mensaje aquí..." className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-8 text-sm min-h-[150px] outline-none mb-8 text-left" />
                            <div className="grid grid-cols-2 gap-4"><button onClick={() => setSelectedAsesorMsg(null)} className="py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all">Cancelar</button><button onClick={handleEnviarMensaje} className="py-4 bg-[#39A900] text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-green-200 hover:bg-[#2e8a00] transition-all">Enviar</button></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {toast && (
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-10 py-5 rounded-full shadow-2xl text-white font-black text-xs uppercase tracking-widest ${toast.type === 'error' ? 'bg-red-600' : 'bg-[#39A900]'}`}>{toast.message}</motion.div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #39A900; border-radius: 10px; }
            `}} />
        </div>
    );
}
