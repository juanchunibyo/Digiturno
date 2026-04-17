import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { 
    Users, Clock, AlertTriangle, Monitor, LogOut, 
    Activity, CheckCircle, User, Settings, BarChart,
    ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, ChevronRight, Calendar, Filter
} from 'lucide-react';

export default function CoordinadorDashboard({ auth }) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [filtroAsesor, setFiltroAsesor] = useState('todos');
    const [filtroMes, setFiltroMes] = useState('abril');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Datos simulados (mocks) interactivos según el filtro
    const analiticas = {
        todos: { espera: 15, asesor: 12 },
        1: { espera: 12, asesor: 14 },
        2: { espera: 8, asesor: 10 },
        3: { espera: 18, asesor: 11 },
        4: { espera: 14, asesor: 15 },
        5: { espera: 20, asesor: 25 },
    };

    const getAnalitica = () => {
        const key = filtroAsesor;
        const data = analiticas[key] || analiticas.todos;
        // Simulamos variación por mes si no es "abril"
        const modificadorMes = filtroMes === 'marzo' ? 1.2 : filtroMes === 'febrero' ? 0.9 : 1;
        
        const espera = Math.round(data.espera * modificadorMes);
        const asesor = Math.round(data.asesor * modificadorMes);
        const total = espera + asesor;
        return { espera, asesor, total };
    };

    const statsSeleccionadas = getAnalitica();

    const KPIs = [
        { title: "En Espera Global", value: "34", trend: "+12", trendUp: false, icon: Users, color: "text-[#39A900]", bg: "bg-[#39A900]/10" },
        { title: "Tiempo Promedio", value: "12 min", trend: "-3 min", trendUp: true, icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Asesores Activos", value: "8/10", trend: "Óptimo", trendUp: true, icon: Monitor, color: "text-purple-600", bg: "bg-purple-100" },
        { title: "Atenciones Hoy", value: "256", trend: "+45", trendUp: true, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-100" }
    ];

    const asesores = [
        { id: 1, name: "María Alejandra", box: "Taquilla 1", status: "ATENDIENDO", turn: "N-042", time: "05:12", avatar: "MA" },
        { id: 2, name: "Carlos Ramírez", box: "Taquilla 2", status: "DISPONIBLE", turn: "--", time: "--", avatar: "CR" },
        { id: 3, name: "Juana de Dios", box: "Taquilla 3", status: "ATENDIENDO", turn: "P-018", time: "14:45", avatar: "JD" },
        { id: 4, name: "Pedro Páramo", box: "Taquilla 4", status: "PAUSA", turn: "--", time: "10:00", avatar: "PP" },
        { id: 5, name: "Lucía Pineda", box: "Taquilla 5", status: "ATENDIENDO", turn: "V-003", time: "28:10", avatar: "LP" }, 
    ];

        const ciudadanosEnEspera = [
        { id: 1, turn: "N-089", type: "Prioritaria", waitTime: "42 min", alert: true },
        { id: 2, turn: "V-012", type: "Normal", waitTime: "18 min", alert: false },
        { id: 3, turn: "E-004", type: "Empresa", waitTime: "05 min", alert: false },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#F4F6F9] font-['Inter',sans-serif] text-gray-800 overflow-hidden">
            <Head><title>Centro de Comando | SENA APE</title></Head>

            {/* HEADER AL ESTILO ASESOR PERO COORDINADOR */}
            <header className="h-[5.5rem] bg-white shadow-sm flex items-center justify-between px-8 shrink-0 relative z-10 w-full">
                <div className="flex items-center gap-6">
                    <img src="/logo-ape.png" alt="SENA APE" className="h-12 object-contain" />
                    <div className="hidden sm:block border-l-2 border-gray-200 pl-6">
                        <p className="text-[#0B3D2E] font-black text-base leading-none flex items-center gap-2">
                            <Activity className="text-[#39A900]" size={18} /> PANEL DE SUPERVISIÓN
                        </p>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Coordinación APE</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <Link href={route('logout')} method="post" as="button" className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Cerrar Sesión">
                        <LogOut size={24} />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-lg font-black shadow-md">
                            {auth?.user?.name ? auth.user.name.charAt(0) : 'C'}
                        </div>
                        <div className="hidden sm:block text-right">
                            <p className="text-base font-bold text-gray-800 leading-none">{auth?.user?.name || 'Coordinador APE'}</p>
                            <p className="text-xs text-[#39A900] font-bold mt-1 uppercase tracking-wider">Nivel Administrativo</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-x-hidden overflow-y-auto w-full p-6 lg:p-8 2xl:p-12 flex flex-col gap-8">
                
                {/* BARRA DE ESTADO */}
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Monitoreo en Tiempo Real</h2>
                        <p className="text-gray-500 font-medium flex items-center gap-2 mt-1">
                            <Clock size={16} className="text-[#39A900]" />
                            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Sincronizado
                        </p>
                    </div>
                </div>

                {/* Grid KPIs (ESTILO ASESOR) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {KPIs.map((kpi, idx) => {
                        const Icon = kpi.icon;
                        return (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                transition={{ delay: idx * 0.1 }}
                                key={idx} 
                                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden group hover:border-[#39A900]/50 transition-all duration-300"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                                        <Icon size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full ${kpi.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {kpi.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {kpi.trend}
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">{kpi.title}</h3>
                                    <div className="text-4xl font-black text-gray-800">{kpi.value}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="flex flex-col xl:flex-row gap-8 flex-1 items-start">
                    
                    {/* PANEL IZQUIERDO: MONITOR DE ASESORES (TOMA EL 65% DEL ESPACIO) */}
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} style={{ flex: 2 }} className="w-full bg-white border border-gray-200 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-[#F4F6F9]">
                            <h3 className="text-xl font-black text-[#0B3D2E] flex items-center gap-2">
                                <Monitor className="text-[#39A900]" size={22} />
                                Actividad de los Asesores
                            </h3>
                            <div className="flex gap-3">
                                <span className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>3 Atendiendo</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4 w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-gray-400 text-[11px] font-black uppercase tracking-widest border-b-2 border-gray-100">
                                        <th className="px-6 py-4">Asesor</th>
                                        <th className="px-6 py-4">Estado (Cuando atiende)</th>
                                        <th className="px-6 py-4">Tiempo del asesor (Turno Actual)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {asesores.map((asesor, idx) => (
                                        <tr key={asesor.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm">
                                                        {asesor.avatar}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-gray-800 block text-lg">{asesor.name}</span>
                                                        <span className="text-xs font-bold text-gray-400">{asesor.box}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black tracking-wider uppercase ${
                                                        asesor.status === 'ATENDIENDO' ? 'bg-green-100 text-green-700' :
                                                        asesor.status === 'DISPONIBLE' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {asesor.status === 'ATENDIENDO' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
                                                        {asesor.status}
                                                    </span>
                                                    {asesor.status === 'ATENDIENDO' && (
                                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                            Turno: {asesor.turn}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 font-mono font-bold">
                                                <div className="flex items-center gap-3">
                                                    <Clock size={18} className={asesor.time.startsWith('28') ? 'text-red-500' : 'text-gray-400'} />
                                                    <span className={`text-xl ${asesor.time.startsWith('28') ? 'text-red-600 font-black' : 'text-[#39A900]'}`}>{asesor.time}</span>
                                                    <span className="text-xs text-gray-400 font-sans tracking-wide">Min:Seg</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* PANEL DERECHO: CIUDADANOS EN ESPERA (TOMA EL 35% DEL ESPACIO) */}
                    <div style={{ flex: 1 }} className="w-full flex flex-col gap-6">
                        
                        {/* TIEMPO QUE ESPERA LA PERSONA */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex-1 bg-white border border-gray-200 rounded-3xl flex flex-col overflow-hidden shadow-[0_4px_20px_rgba(33,33,33,0.03)]">
                            <div className="px-6 py-6 border-b border-gray-100 bg-[#F4F6F9]">
                                <h3 className="text-lg font-black text-[#0B3D2E] flex items-center gap-2">
                                    <Users size={20} className="text-[#39A900]" />
                                    Tiempos de Espera (Ciudadanos)
                                </h3>
                                <p className="text-xs font-bold text-gray-500 mt-1">¿Cuánto espera una persona antes de ser atendida?</p>
                            </div>
                            <div className="p-5 flex flex-col gap-4 flex-1 overflow-auto">
                                {ciudadanosEnEspera.map(persona => (
                                    <div key={persona.id} className="bg-white border border-gray-100 hover:border-gray-300 p-4 rounded-2xl flex items-center justify-between shadow-sm transition-all">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-gray-800 text-xl">{persona.turn}</span>
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md w-max ${persona.type === 'Prioritaria' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {persona.type}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Esperando</span>
                                            <div className={`font-black text-lg ${persona.alert ? 'text-red-500' : 'text-gray-700'}`}>
                                                {persona.waitTime}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ACCIONES RÁPIDAS ADMINISTRATIVAS */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm shrink-0">
                            <h3 className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-4">Exportar Reportes</h3>
                            <button className="w-full bg-gray-50 hover:bg-white hover:border-[#39A900] border-2 border-transparent rounded-2xl p-4 flex items-center justify-between gap-4 transition-all group shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 text-green-700 rounded-lg group-hover:scale-110 transition-transform">
                                        <BarChart size={20} />
                                    </div>
                                    <span className="font-bold text-gray-700 text-sm">Descargar Tiempos Asesores</span>
                                </div>
                                <ArrowDownRight size={18} className="text-gray-400 group-hover:text-[#39A900]" />
                            </button>
                        </motion.div>
                    </div>

                </div>

                {/* NUEVO PANEL COMPLETO: ANÁLISIS DE DESEMPEÑO DE ASESOR / OFICINA */}
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col mt-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-6 gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                                <BarChart className="text-[#39A900]" size={24} />
                                Análisis Histórico de Desempeño
                            </h3>
                            <p className="text-sm font-bold text-gray-500 mt-1">Evalúa el rendimiento de toda la oficina o de asesores específicos.</p>
                        </div>
                        
                        <div className="flex bg-gray-50 p-2 rounded-xl border border-gray-100 gap-3 w-full md:w-auto overflow-x-auto">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm min-w-max">
                                <Filter size={16} className="text-blue-500" />
                                <select 
                                    className="bg-transparent border-none outline-none text-sm font-black text-gray-700 cursor-pointer focus:ring-0 appearance-none pr-6"
                                    value={filtroAsesor}
                                    onChange={(e) => setFiltroAsesor(e.target.value)}
                                    style={{ background: 'transparent' }}
                                >
                                    <option value="todos">Toda la Oficina / Global</option>
                                    {asesores.map(a => <option key={a.id} value={a.id}>{a.name} ({a.box})</option>)}
                                </select>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm min-w-max">
                                <Calendar size={16} className="text-[#39A900]" />
                                <select 
                                    className="bg-transparent border-none outline-none text-sm font-black text-gray-700 cursor-pointer focus:ring-0 appearance-none pr-6"
                                    value={filtroMes}
                                    onChange={(e) => setFiltroMes(e.target.value)}
                                    style={{ background: 'transparent' }}
                                >
                                    <option value="abril">Mes Actual (Abril)</option>
                                    <option value="marzo">Mes Anterior (Marzo)</option>
                                    <option value="febrero">Febrero</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Métrica: Tiempo Espera */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between group hover:border-[#39A900]/50 transition-colors">
                            <div>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">T. Medio de Espera</h4>
                                <div className="text-4xl font-black text-gray-800">{statsSeleccionadas.espera} <span className="text-lg font-bold text-gray-400">min</span></div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 line-clamp-1">Ciudadano esperando ser llamado</p>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Users size={28} />
                            </div>
                        </div>

                        {/* 2. Métrica: Tiempo Asesor */}
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between group hover:border-emerald-500/50 transition-colors">
                            <div>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">T. Medio del Asesor</h4>
                                <div className="text-4xl font-black text-gray-800">{statsSeleccionadas.asesor} <span className="text-lg font-bold text-gray-400">min</span></div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 line-clamp-1">Duración exacta de la asesoría</p>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                <User size={28} />
                            </div>
                        </div>

                        {/* 3. Métrica: Tiempo Total */}
                        <div className="bg-[#1B4332] rounded-2xl p-6 border border-[#0B3D2E] flex items-center justify-between relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 opacity-10">
                                <Clock size={120} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xs font-black text-green-300 uppercase tracking-widest mb-2">T. Total Invertido</h4>
                                <div className="text-4xl font-black text-white">{statsSeleccionadas.total} <span className="text-lg font-bold text-green-400">min</span></div>
                                <p className="text-[10px] uppercase font-bold text-green-500 mt-2 line-clamp-1">Espera + Asesoría = Estancia Total</p>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-[#39A900] text-white flex items-center justify-center shrink-0 relative z-10 shadow-lg">
                                <Activity size={28} />
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
