import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, Clock, AlertTriangle, Monitor, LogOut, 
    Activity, CheckCircle, User, Settings, BarChart,
    ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, 
    ChevronRight, Calendar, Filter, Search, MessageSquare, 
    UserPlus, Eye, FileText, Download, Briefcase, TrendingUp
} from 'lucide-react';

// Componente para mini-gráficas de líneas (Sparklines)
const Sparkline = ({ data, color }) => {
    const points = data.map((val, i) => `${(i * 100) / (data.length - 1)},${100 - val}`).join(' ');
    return (
        <svg viewBox="0 0 100 100" className="w-24 h-12 overflow-visible">
            <motion.polyline
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Sombra debajo de la línea */}
            <motion.polyline
                fill="none"
                stroke={color}
                strokeWidth="12"
                strokeOpacity="0.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="blur-[2px]"
            />
        </svg>
    );
};

export default function CoordinadorDashboard({ auth, kpis: initialKpis, asesoresData: initialAsesores, ciudadanosEnEspera: initialEspera }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsesorMsg, setSelectedAsesorMsg] = useState(null);
    const [selectedAsesorView, setSelectedAsesorView] = useState(null);
    const [msgContent, setMsgContent] = useState('');

    const handleEnviarMensaje = () => {
        if (!msgContent.trim()) return;
        router.post(route('coordinador.enviar-mensaje'), {
            asesor_id: selectedAsesorMsg.id,
            mensaje: msgContent
        }, {
            onSuccess: () => {
                setSelectedAsesorMsg(null);
                setMsgContent('');
            }
        });
    };
    
    const [mesFiltroOficina, setMesFiltroOficina] = useState('');
    const [statsOficinaMes, setStatsOficinaMes] = useState(null);
    const [mesFiltroAsesor, setMesFiltroAsesor] = useState('');
    const [statsAsesorMes, setStatsAsesorMes] = useState(null);

    useEffect(() => {
        if (mesFiltroOficina) {
            fetch(`/api/coordinador/datos?mes=${mesFiltroOficina}`)
                .then(res => res.json())
                .then(data => setStatsOficinaMes(data));
        } else {
            setStatsOficinaMes(null);
        }
    }, [mesFiltroOficina]);

    useEffect(() => {
        if (selectedAsesorView && mesFiltroAsesor) {
            fetch(`/api/coordinador/datos?mes=${mesFiltroAsesor}&asesor_id=${selectedAsesorView.id}`)
                .then(res => res.json())
                .then(data => setStatsAsesorMes(data));
        } else {
            setStatsAsesorMes(null);
        }
    }, [mesFiltroAsesor, selectedAsesorView]);

    const [filtroAsesor, setFiltroAsesor] = useState('todos');
    
    const [kpis, setKpis] = useState(initialKpis);
    const [asesores, setAsesores] = useState(initialAsesores || []);
    const [ciudadanosEnEspera, setCiudadanosEnEspera] = useState(initialEspera || []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAsignar = (turnoId, asesorId) => {
        router.post(route('coordinador.asignar'), {
            turno_id: turnoId,
            asesor_id: asesorId
        }, { preserveScroll: true });
    };

    const handleCambiarTaquilla = (asesorId) => {
        const nuevaTaquilla = prompt("Ingrese el nuevo número de taquilla/módulo:");
        if (nuevaTaquilla) {
            router.post(route('coordinador.taquilla'), {
                asesor_id: asesorId,
                taquilla: nuevaTaquilla
            }, { preserveScroll: true });
        }
    };

    const handleToggleVictimas = (asesorId) => {
        router.post(route('coordinador.toggle-victimas'), {
            asesor_id: asesorId
        }, { preserveScroll: true });
    };

    // POLLING EN TIEMPO REAL
    useEffect(() => {
        const interval = setInterval(() => {
            fetch('/api/coordinador/datos')
                .then(res => res.json())
                .then(data => {
                    setKpis(data.kpis);
                    setAsesores(data.asesoresData);
                    setCiudadanosEnEspera(data.ciudadanosEnEspera);
                });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds) => {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const KPIs_Display = [
        { title: "En Espera Global", value: kpis.enEspera, trend: "", trendUp: false, icon: Users, color: "#39A900", bg: "bg-green-50", chartData: [40, 60, 45, 80, 50, 90, 70] },
        { title: "Tiempo Promedio", value: `${kpis.tiempoPromedio} min`, trend: "", trendUp: true, icon: Clock, color: "#EF4444", bg: "bg-red-50", chartData: [80, 70, 85, 60, 75, 40, 30] },
        { title: "Asesores Activos", value: `${kpis.asesoresActivos}/${kpis.totalAsesores}`, trend: "", trendUp: true, icon: Monitor, color: "#3B82F6", bg: "bg-blue-50", chartData: [20, 30, 40, 50, 60, 70, 80] },
        { title: "Atenciones Hoy", value: kpis.atencionesHoy, trend: "", trendUp: true, icon: CheckCircle, color: "#10B981", bg: "bg-emerald-50", chartData: [10, 30, 20, 50, 40, 80, 95] }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-['Inter',sans-serif] text-slate-800 overflow-hidden select-none">
            <Head><title>Supervisión APE | Centro de Comando</title></Head>

            <header className="h-[5rem] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 relative z-30 shadow-sm">
                <div className="flex items-center gap-8">
                    <img src="/logo-ape.png" alt="SENA APE" className="h-10 object-contain" />
                    <div className="hidden lg:flex items-center gap-4 border-l border-slate-200 pl-8">
                        <div className="bg-green-50 p-2 rounded-lg">
                            <TrendingUp className="text-[#39A900]" size={20} />
                        </div>
                        <div>
                            <p className="text-slate-900 font-black text-sm uppercase tracking-wider leading-none">Panel de Supervisión</p>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Coordinación APE</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shadow-inner">
                        <div className="flex flex-col text-right">
                            <p className="text-sm font-black text-slate-700 leading-none">{auth?.user?.name || 'Francisco González'}</p>
                            <p className="text-[10px] text-[#39A900] font-bold mt-1 uppercase tracking-wider">Nivel Administrativo</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-sm font-black ring-2 ring-white shadow-md">
                            {auth?.user?.name ? auth.user.name.charAt(0) : 'F'}
                        </div>
                    </div>
                    <Link href={route('logout')} method="post" as="button" className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Cerrar Sesión">
                        <LogOut size={22} />
                    </Link>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 lg:p-10 flex flex-col gap-8 custom-scrollbar">
                
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Monitoreo en Tiempo Real</h1>
                        <p className="text-slate-400 font-bold text-sm flex items-center gap-2 mt-1">
                            <Clock size={16} className="text-[#39A900]" />
                            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Sincronizado
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {KPIs_Display.map((kpi, idx) => (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} 
                            animate={{ y: 0, opacity: 1 }} 
                            transition={{ delay: idx * 0.1 }}
                            key={idx} 
                            className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                                    <kpi.icon size={22} style={{ color: kpi.color }} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-1">{kpi.title}</h3>
                                    <div className="text-4xl font-black text-slate-800">{kpi.value}</div>
                                </div>
                                <Sparkline data={kpi.chartData} color={kpi.color} />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex flex-col xl:flex-row gap-8 items-start">
                    <div className="flex-[2.5] w-full bg-white border border-slate-100 rounded-[32px] shadow-sm flex flex-col overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Monitor className="text-[#39A900]" size={24} />
                                Actividad de los Asesores
                            </h3>
                        </div>

                        <div className="p-4 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-6 py-4">Asesor</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4">Tiempo de Atención</th>
                                        <th className="px-6 py-4 text-center">Gestión</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence mode='popLayout'>
                                        {asesores.map((asesor) => (
                                            <motion.tr 
                                                key={asesor.id}
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className={`w-10 h-10 rounded-full ${asesor.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'} flex items-center justify-center font-black text-xs ring-4 ring-white shadow-sm`}>
                                                                {asesor.avatar}
                                                            </div>
                                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${asesor.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-slate-400'}`} title={asesor.isOnline ? 'Conectado' : 'Desconectado'}></div>
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 text-base leading-none flex items-center gap-2">
                                                                {asesor.name}
                                                                {!asesor.activo && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter font-black">Pausado</span>}
                                                            </p>
                                                            <button onClick={() => handleCambiarTaquilla(asesor.id)} className="text-xs font-bold text-slate-400 hover:text-[#39A900] hover:underline mt-1 transition-colors">
                                                                {asesor.box} • Click para cambiar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase w-max border ${
                                                        asesor.status === 'ATENDIENDO' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                                        asesor.status === 'DISPONIBLE' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                                            asesor.status === 'ATENDIENDO' ? 'bg-blue-500' : 
                                                            asesor.status === 'DISPONIBLE' ? 'bg-green-500' : 'bg-slate-400'
                                                        }`} />
                                                        {asesor.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-black text-lg ${asesor.timeInSeconds > 600 ? 'text-red-500' : 'text-slate-800'}`}>
                                                            {asesor.status === 'ATENDIENDO' ? asesor.time : '--'}
                                                        </span>
                                                        {asesor.status === 'ATENDIENDO' && asesor.timeInSeconds > 600 && <AlertCircle className="text-red-500" size={16} />}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <button onClick={() => handleToggleVictimas(asesor.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                                                            asesor.tipo_asesor === 'Víctimas' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                        }`}>
                                                            {asesor.tipo_asesor === 'Víctimas' ? 'Quitar Víctimas' : 'Asignar a Víctimas'}
                                                        </button>
                                                        <button onClick={() => setSelectedAsesorMsg(asesor)} className="p-2.5 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all shadow-sm">
                                                            <MessageSquare size={20} />
                                                        </button>
                                                        <button onClick={() => setSelectedAsesorView(asesor)} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
                                                            <Eye size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-6">
                        <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col p-6">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 mb-6">
                                <Users size={22} className="text-[#39A900]" />
                                Tiempos de Espera
                            </h3>
                            <div className="flex flex-col gap-4">
                                <AnimatePresence>
                                    {ciudadanosEnEspera.map((item) => (
                                        <motion.div 
                                            key={item.id}
                                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                                            className="flex flex-col rounded-2xl border border-slate-100 shadow-sm overflow-hidden bg-white"
                                        >
                                            <div className="flex items-stretch">
                                                <div className={`w-16 ${item.alert ? 'bg-red-500' : 'bg-[#39A900]'} flex flex-col items-center justify-center text-white`}>
                                                    <span className="text-sm font-black">{item.turn}</span>
                                                </div>
                                                <div className="flex-1 p-3 flex justify-between items-center">
                                                    <span className="text-sm font-black">{item.waitTime}</span>
                                                    <select 
                                                        onChange={(e) => handleAsignar(item.id, e.target.value)}
                                                        className="text-[10px] font-black uppercase bg-slate-50 border-none rounded-lg px-2 py-1"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Asignar</option>
                                                        {asesores.filter(a => a.status === 'DISPONIBLE').map(a => (
                                                            <option key={a.id} value={a.id}>{a.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* FILTRO GLOBAL DE LA OFICINA */}
                        <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col p-6 mt-6">
                            <div className="flex items-center justify-between gap-3 mb-6">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                    <BarChart size={22} className="text-[#39A900]" />
                                    Totalidad de la Oficina
                                </h3>
                                <input 
                                    type="month" 
                                    className="text-xs border-slate-200 rounded-xl px-2 py-1 outline-none focus:border-[#39A900] focus:ring-2 focus:ring-[#39A900]/20 text-slate-600 font-bold"
                                    value={mesFiltroOficina}
                                    onChange={(e) => setMesFiltroOficina(e.target.value)}
                                />
                            </div>
                            
                            {statsOficinaMes ? (
                                <div className="flex flex-col gap-3">
                                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                                        <span className="text-xs font-black text-slate-400 uppercase">Atenciones en {mesFiltroOficina}</span>
                                        <span className="text-2xl font-black text-[#39A900]">{statsOficinaMes.atenciones}</span>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                                        <span className="text-xs font-black text-slate-400 uppercase">Tiempo Promedio</span>
                                        <span className="text-2xl font-black text-slate-800">{statsOficinaMes.tiempoPromedio} min</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 text-center py-6 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    Selecciona un mes para ver las estadísticas históricas de toda la oficina.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* MODAL DE VISTA EN VIVO */}
            <AnimatePresence>
                {selectedAsesorView && (
                    <div key="live-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-8 bg-[#1B4332] text-white flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-black">{selectedAsesorView?.avatar}</div>
                                    <div>
                                        <h2 className="text-xl font-black">{selectedAsesorView?.name}</h2>
                                        <p className="text-green-400 text-xs">{selectedAsesorView?.box}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAsesorView(null)} className="text-white hover:text-red-400"><LogOut size={24} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Turno Actual</p>
                                        <p className="text-2xl font-black">{selectedAsesorView?.turn}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Tiempo</p>
                                        <p className="text-2xl font-black text-[#39A900]">{selectedAsesorView?.time}</p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-black text-slate-800">Historial del Asesor</h4>
                                        <input 
                                            type="month" 
                                            className="text-xs border-slate-200 rounded-xl px-2 py-1 outline-none focus:border-[#39A900] text-slate-600 font-bold bg-slate-50"
                                            value={mesFiltroAsesor}
                                            onChange={(e) => setMesFiltroAsesor(e.target.value)}
                                        />
                                    </div>
                                    
                                    {statsAsesorMes ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-green-50 p-3 rounded-xl">
                                                <p className="text-[10px] font-black text-green-600 uppercase mb-1">Atenciones</p>
                                                <p className="text-xl font-black text-green-700">{statsAsesorMes.atenciones}</p>
                                            </div>
                                            <div className="bg-blue-50 p-3 rounded-xl">
                                                <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Promedio</p>
                                                <p className="text-xl font-black text-blue-700">{statsAsesorMes.tiempoPromedio}m</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 text-center py-2 font-bold">Selecciona un mes para ver datos históricos</p>
                                    )}
                                </div>

                                <button onClick={() => { setSelectedAsesorView(null); setMesFiltroAsesor(''); }} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-700 transition-colors">CERRAR VISTA</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL PARA ENVIAR MENSAJE */}
            <AnimatePresence>
                {selectedAsesorMsg && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800">Enviar Mensaje</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">A: {selectedAsesorMsg.name}</p>
                                    </div>
                                </div>
                                
                                <textarea 
                                    autoFocus
                                    value={msgContent}
                                    onChange={(e) => setMsgContent(e.target.value)}
                                    placeholder="Escribe un mensaje de apoyo, felicitación o instrucción..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm text-slate-700 min-h-[120px] focus:ring-4 focus:ring-[#39A900]/10 focus:border-[#39A900] outline-none transition-all resize-none shadow-inner mb-6"
                                />

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setSelectedAsesorMsg(null)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-xs rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleEnviarMensaje}
                                        className="flex-[2] py-4 bg-[#39A900] text-white font-black text-xs rounded-xl uppercase tracking-widest shadow-lg shadow-green-500/20 hover:bg-[#2D8000] transition-all"
                                    >
                                        Enviar Mensaje
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            `}} />
        </div>
    );
}
