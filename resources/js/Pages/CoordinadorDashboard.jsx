import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
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

export default function CoordinadorDashboard({ auth }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsesorMsg, setSelectedAsesorMsg] = useState(null);
    const [selectedAsesorView, setSelectedAsesorView] = useState(null);
    const [filtroAsesor, setFiltroAsesor] = useState('todos');
    const [filtroMes, setFiltroMes] = useState('abril');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Función para cambiar el reporte de abajo
    const seleccionarReporteAsesor = (id) => {
        setFiltroAsesor(id.toString());
        // Scroll suave a la sección de reportes
        document.getElementById('analisis-historico')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Datos simulados (mocks) interactivos según el filtro
    const analiticas = {
        todos: { espera: 15, asesor: 12 },
        1: { espera: 12, asesor: 14 },
        2: { espera: 8, asesor: 10 },
        3: { espera: 18, asesor: 11 },
        4: { espera: 14, asesor: 15 },
        5: { espera: 20, asesor: 25 },
    };

    const KPIs = [
        { title: "En Espera Global", value: "34", trend: "+3", trendUp: false, icon: Users, color: "#39A900", bg: "bg-green-50", chartData: [40, 60, 45, 80, 50, 90, 70] },
        { title: "Tiempo Promedio", value: "12 min", trend: "-3 min", trendUp: true, icon: Clock, color: "#EF4444", bg: "bg-red-50", chartData: [80, 70, 85, 60, 75, 40, 30] },
        { title: "Asesores Activos", value: "8/10", trend: "Óptimo", trendUp: true, icon: Monitor, color: "#3B82F6", bg: "bg-blue-50", chartData: [20, 30, 40, 50, 60, 70, 80] },
        { title: "Atenciones Hoy", value: "256", trend: "+45", trendUp: true, icon: CheckCircle, color: "#10B981", bg: "bg-emerald-50", chartData: [10, 30, 20, 50, 40, 80, 95] }
    ];

    const [asesores, setAsesores] = useState([
        { id: 1, name: "María Alejandra", box: "Taquilla 1", status: "ATENDIENDO", turn: "N-042", timeInSeconds: 450, avatar: "MA", progress: 65 },
        { id: 2, name: "Carlos Ramírez", box: "Taquilla 2", status: "DISPONIBLE", turn: "--", timeInSeconds: 0, avatar: "CR", progress: 0 },
        { id: 3, name: "Juana de Dios", box: "Taquilla 3", status: "ATENDIENDO", turn: "V-015", timeInSeconds: 120, avatar: "JD", progress: 20 },
        { id: 4, name: "Pedro Páramo", box: "Taquilla 4", status: "ATENDIENDO", turn: "P-004", timeInSeconds: 7, avatar: "PP", progress: 15 },
        { id: 5, name: "Lucía Pineda", box: "Taquilla 5", status: "ATENDIENDO", turn: "N-089", timeInSeconds: 1711, avatar: "LP", progress: 95 }, 
    ]);

    // SIMULACIÓN DE VIDA REAL
    useEffect(() => {
        const interval = setInterval(() => {
            setAsesores(prev => prev.map(asesor => {
                let current = { ...asesor };
                
                // 1. Si está atendiendo, el tiempo vuela
                if (current.status === 'ATENDIENDO') {
                    current.timeInSeconds += 1;
                    // El progreso aumenta proporcionalmente (asumiendo 20 min de meta)
                    current.progress = Math.min(100, (current.timeInSeconds / 1200) * 100);
                }

                // 2. Simulación de cambios de estado aleatorios (1% de prob)
                const rand = Math.random();
                if (rand < 0.02) { 
                    if (current.status === 'DISPONIBLE') {
                        current.status = 'ATENDIENDO';
                        current.timeInSeconds = 0;
                        current.progress = 0;
                        current.turn = ['N-', 'P-', 'V-', 'E-'][Math.floor(Math.random()*4)] + Math.floor(100 + Math.random() * 900);
                    } else if (current.status === 'ATENDIENDO' && current.timeInSeconds > 300) {
                        // Después de 5 min hay chance de que termine
                        if (Math.random() > 0.7) {
                            current.status = 'DISPONIBLE';
                            current.turn = '--';
                            current.timeInSeconds = 0;
                            current.progress = 0;
                        }
                    }
                }
                
                return current;
            }));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (totalSeconds) => {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    // Tiempos de espera a la derecha
    const tiemposEspera = [
        { turn: "N-089", status: "CRÍTICO", color: "bg-red-500", time: "42 min", alert: "CRITICAL" },
        { turn: "V-012", status: "NORMAL", color: "bg-amber-500", time: "18 min", alert: "NORMAL" },
        { turn: "E-004", status: "NORMAL", color: "bg-emerald-500", time: "15 min", alert: "NORMAL" },
        { turn: "E-005", status: "NORMAL", color: "bg-emerald-400", time: "05 min", alert: "NORMAL" },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-['Inter',sans-serif] text-slate-800 overflow-hidden select-none">
            <Head><title>Supervisión APE | Centro de Comando</title></Head>

            {/* HEADER - Estilo Limpio */}
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
                
                {/* TÍTULO Y TIEMPO */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Monitoreo en Tiempo Real</h1>
                        <p className="text-slate-400 font-bold text-sm flex items-center gap-2 mt-1">
                            <Clock size={16} className="text-[#39A900]" />
                            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Sincronizado
                        </p>
                    </div>
                </div>

                {/* Grid KPIs - RECREANDO IMAGEN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {KPIs.map((kpi, idx) => (
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
                                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${kpi.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {kpi.trend}
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
                    
                    {/* PANEL CENTRAL: ACTIVIDAD DE ASESORES */}
                    <div className="flex-[2.5] w-full bg-white border border-slate-100 rounded-[32px] shadow-sm flex flex-col overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <Monitor className="text-[#39A900]" size={24} />
                                Actividad de los Asesores
                            </h3>
                            <div className="flex items-center gap-4">
                                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    2 Atenciones
                                </span>
                            </div>
                        </div>

                        <div className="p-4 overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-6 py-4">Asesor</th>
                                        <th className="px-6 py-4">Estado (Turno Atendido)</th>
                                        <th className="px-6 py-4">Tiempo del Asesor (Turno Actual)</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {asesores.map((asesor) => (
                                        <tr key={asesor.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs ring-4 ring-white shadow-sm">
                                                        {asesor.avatar}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-base leading-none">{asesor.name}</p>
                                                        <p className="text-xs font-bold text-slate-400 mt-1">{asesor.box}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase w-max ${
                                                        asesor.status === 'ATENDIENDO' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        {asesor.status}
                                                    </span>
                                                    {asesor.status === 'ATENDIENDO' && (
                                                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded w-max">
                                                            Taquilla {asesor.turn}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden w-32 shadow-inner">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${asesor.progress}%` }}
                                                            className={`h-full rounded-full ${asesor.progress > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-black text-lg ${asesor.timeInSeconds > 1200 ? 'text-red-500' : 'text-slate-800'}`}>
                                                            {formatTime(asesor.timeInSeconds)}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">min:seg</span>
                                                        {asesor.timeInSeconds > 1200 && <AlertCircle className="text-red-500" size={16} />}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button 
                                                        onClick={() => setSelectedAsesorMsg(asesor)}
                                                        className="p-2.5 text-slate-400 hover:text-[#39A900] hover:bg-green-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-green-100" 
                                                        title="Enviar Mensaje">
                                                        <MessageSquare size={20} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedAsesorView(asesor)}
                                                        className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100" 
                                                        title="Ver Actividad en Vivo">
                                                        <Eye size={20} />
                                                    </button>
                                                    <button 
                                                        onClick={() => seleccionarReporteAsesor(asesor.id)}
                                                        className="p-2.5 text-slate-400 hover:text-purple-500 hover:bg-purple-100 rounded-xl transition-all shadow-sm border border-transparent hover:border-purple-200" 
                                                        title="Ver Reporte Individual">
                                                        <FileText size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* PANEL DERECHO: TIEMPOS DE ESPERA Y REPORTES */}
                    <div className="flex-1 w-full flex flex-col gap-6">
                        
                        <div className="bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
                            <div className="px-6 py-6 border-b border-slate-50 bg-slate-50/50">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                    <Users size={22} className="text-[#39A900]" />
                                    Tiempos de Espera (Ciudadanos)
                                </h3>
                                <p className="text-xs font-bold text-slate-400 mt-1 italic">¿Cuánto espera una persona antes de ser atendida?</p>
                            </div>
                            
                            <div className="p-6 flex flex-col gap-4">
                                {tiemposEspera.map((item, idx) => (
                                    <div key={idx} className="flex items-stretch rounded-2xl overflow-hidden border border-slate-100 shadow-sm group hover:scale-[1.02] transition-all">
                                        <div className={`w-24 ${item.color} flex flex-col items-center justify-center p-3 text-white`}>
                                            <span className="text-lg font-black leading-none">{item.turn}</span>
                                            <span className="text-[8px] font-black mt-1 uppercase tracking-widest opacity-80">{item.status}</span>
                                        </div>
                                        <div className="flex-1 p-4 bg-white flex justify-end items-center gap-3">
                                            <span className="text-2xl font-black text-slate-800">{item.time}</span>
                                            <ArrowRight size={20} className="text-slate-300 group-hover:text-[#39A900] group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 mt-auto border-t border-slate-50">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Exportar Reportes</p>
                                <button className="w-full flex items-center justify-between p-4 bg-[#F8FAF9] border-2 border-transparent hover:border-[#39A900] rounded-2xl group transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-lg text-[#39A900] group-hover:bg-[#39A900] group-hover:text-white transition-all">
                                            <Download size={20} />
                                        </div>
                                        <span className="text-sm font-black text-slate-700">Descargar Reportes</span>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-all" />
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* SECCIÓN INFERIOR: ANÁLISIS HISTÓRICO */}
                <div id="analisis-historico" className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm scroll-mt-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <BarChart className="text-[#39A900]" size={28} />
                                Análisis Histórico: <span className="text-[#39A900]">{filtroAsesor === 'todos' ? 'Global Oficina' : asesores.find(a => a.id.toString() === filtroAsesor)?.name}</span>
                            </h3>
                            <p className="text-sm font-bold text-slate-400 mt-1">Evaluación del rendimiento estable del asesor o grupo seleccionado.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex gap-2">
                                <select 
                                    value={filtroAsesor}
                                    onChange={(e) => setFiltroAsesor(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl px-4 py-2 focus:ring-[#39A900] focus:border-[#39A900]">
                                    <option value="todos">Toda la Oficina</option>
                                    {asesores.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                                <button className="px-4 py-2 text-[#39A900] text-xs font-black hover:bg-white rounded-xl transition-all">Exportar Datos</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-blue-100 transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">T. Medio de Espera</p>
                                    <div className="text-4xl font-black text-slate-800">15 min <span className="text-xs text-slate-400 font-bold">(Meta: 10 min)</span></div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-2xl text-blue-500"><Users size={24} /></div>
                            </div>
                            <Sparkline data={[30, 45, 20, 60, 35, 50, 40]} color="#3B82F6" />
                        </div>

                        <div className="bg-slate-50/50 border border-slate-100 rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group hover:border-amber-100 transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">T. Medio del Asesor</p>
                                    <div className="text-4xl font-black text-slate-800">12 min <span className="text-xs text-slate-400 font-bold">(Meta: 10 min)</span></div>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-2xl text-amber-500"><Monitor size={24} /></div>
                            </div>
                            <Sparkline data={[60, 50, 65, 45, 55, 40, 45]} color="#F59E0B" />
                        </div>

                        <div className="bg-[#1B4332] rounded-[24px] p-6 flex flex-col gap-4 relative overflow-hidden group shadow-lg shadow-green-900/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-green-300 uppercase tracking-widest mb-1">T. Total Invertido</p>
                                    <div className="text-4xl font-black text-white">27 min</div>
                                </div>
                                <div className="bg-[#39A900] p-3 rounded-2xl text-white shadow-lg"><Activity size={24} /></div>
                            </div>
                            <div className="flex items-center gap-2 relative z-10">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Espera + Asesoría = Estancia Total</span>
                            </div>
                            <Sparkline data={[20, 40, 30, 70, 50, 90, 85]} color="#39A900" />
                        </div>
                    </div>
                </div>

            </main>

            {/* MODAL DE MENSAJE */}
            <AnimatePresence>
                {selectedAsesorMsg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
                        >
                            <div className="p-8 bg-green-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#39A900] text-white rounded-xl"><MessageSquare size={20} /></div>
                                    <div>
                                        <p className="text-xs font-black text-[#1B4332] uppercase tracking-widest">Enviar Mensaje</p>
                                        <p className="text-lg font-black text-[#0B3D2E] leading-none mt-1">{selectedAsesorMsg.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAsesorMsg(null)} className="text-slate-400 hover:text-red-500"><AlertCircle size={24} /></button>
                            </div>
                            <div className="p-8">
                                <textarea 
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-0 focus:border-[#39A900] min-h-[120px]"
                                    placeholder="Escribe tu instrucción para el asesor aquí..."
                                />
                                <button className="w-full bg-[#39A900] text-white py-4 rounded-2xl font-black mt-6 shadow-lg shadow-green-900/20 hover:scale-[1.02] transition-all">
                                    ENVIAR INSTRUCCIÓN
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL DE VISTA EN VIVO (EL OJO) */}
            <AnimatePresence>
                {selectedAsesorView && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
                            className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="p-10 bg-[#1B4332] text-white flex justify-between items-center">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-3xl font-black ring-4 ring-white/10">{selectedAsesorView.avatar}</div>
                                    <div>
                                        <h2 className="text-3xl font-black">{selectedAsesorView.name}</h2>
                                        <p className="text-green-400 font-bold tracking-widest uppercase text-sm mt-1">{selectedAsesorView.box} • {selectedAsesorView.status}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAsesorView(null)} className="bg-white/10 p-3 rounded-full hover:bg-red-500 transition-colors"><LogOut size={24} /></button>
                            </div>
                            <div className="p-10 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Turno en Atención</p>
                                        <p className="text-3xl font-black text-[#0B3D2E]">{selectedAsesorView.turn}</p>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tiempo Transcurrido</p>
                                        <p className="text-3xl font-black text-[#39A900]">{formatTime(selectedAsesorView.timeInSeconds)}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity size={18} className="text-[#39A900]" /> Actividad Reciente
                                    </h4>
                                    <div className="space-y-4">
                                        {['Inicio de atención', 'Check-in realizado', 'Documento validado'].map((act, i) => (
                                            <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border-l-4 border-[#39A900]">
                                                <div className="w-2 h-2 bg-[#39A900] rounded-full"></div>
                                                <span className="text-sm font-bold text-slate-700">{act}</span>
                                                <span className="ml-auto text-xs font-black text-slate-300">Hace {i+2} min</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
            `}} />
        </div>
    );
}

const ArrowRight = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);
