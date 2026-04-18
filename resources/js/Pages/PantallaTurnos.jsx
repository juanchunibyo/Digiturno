import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PantallaTurnos() {
    const { turnoActualInicial, historialInicial } = usePage().props;

    const [currentTime, setCurrentTime] = useState(new Date());
    const [turnoActual, setTurnoActual] = useState(turnoActualInicial || null);
    const [historial, setHistorial] = useState(historialInicial || []);
    const [ring, setRing] = useState(false);
    const [lastId, setLastId] = useState(turnoActualInicial?.id || 0);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Polling cada 5 segundos para detectar nuevos turnos
    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await fetch('/pantalla/turnos');
                const data = await res.json();
                if (data.actual && data.actual.id !== lastId) {
                    setRing(true);
                    setHistorial(data.historial || []);
                    setTurnoActual(data.actual);
                    setLastId(data.actual.id);
                    setTimeout(() => setRing(false), 4000);
                }
            } catch (_) {}
        }, 5000);
        return () => clearInterval(poll);
    }, [lastId]);

    const tipoConfig = {
        'General':     { color: '#4B5563', bg: 'bg-gray-100',    text: 'text-gray-700'    },
        'Prioritaria': { color: '#EA580C', bg: 'bg-orange-100',  text: 'text-orange-700'  },
        'Víctimas':    { color: '#7C3AED', bg: 'bg-purple-100',  text: 'text-purple-700'  },
        'Empresa':     { color: '#1D4ED8', bg: 'bg-blue-100',    text: 'text-blue-700'    },
        'Normal':      { color: '#4B5563', bg: 'bg-gray-100',    text: 'text-gray-700'    },
    };

    const tickerMsg = '   ★   Trámites gratuitos. Evite intermediarios. Reporte cobros irregulares. Conozca nuestros cursos en ape.sena.edu.co.   ★   Los servicios de la Agencia Pública de Empleo SENA son completamente gratuitos.';

    const cfg = tipoConfig[turnoActual?.tipo] || tipoConfig['General'];

    return (
        <div className="w-full h-screen font-['Inter',sans-serif] overflow-hidden select-none flex flex-col bg-[#F4F6F9]">
            <Head><title>Pantalla de Turnos | SENA APE</title></Head>

            {/* Flash llamado */}
            <AnimatePresence>
                {ring && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.07, 0.02, 0.05, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 z-10 pointer-events-none bg-[#39A900]"
                    />
                )}
            </AnimatePresence>

            {/* HEADER */}
            <header className="h-[5.5rem] bg-white shadow-sm flex items-center justify-between px-8 shrink-0 relative z-10 w-full">
                <div className="flex items-center gap-6">
                    <img src="/logo-ape.png" alt="SENA APE" className="h-12 object-contain" />
                    <div className="border-l-2 border-gray-200 pl-6">
                        <p className="text-[#0B3D2E] font-black text-base leading-none">AGENCIA PÚBLICA DE EMPLEO</p>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Sistema de Gestión de Atención</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="font-black text-[#0B3D2E] tracking-tighter" style={{ fontSize: '2.6rem', lineHeight: 1 }}>
                        {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[#39A900] text-xs font-bold capitalize mt-1">
                        {currentTime.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>
            </header>

            {/* BODY */}
            <div className="flex-1 flex gap-5 p-5 overflow-hidden">

                {/* PANEL IZQUIERDO — TURNO ACTUAL */}
                <div className="flex-[5] bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">

                    {/* Badge tipo población */}
                    {turnoActual && (
                    <div className="absolute top-7 left-7 z-10">
                        <span className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border ${cfg.bg} ${cfg.text}`}
                            style={{ borderColor: cfg.color + '40' }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                            Población {turnoActual.tipo}
                        </span>
                    </div>
                    )}

                    {/* Megáfono decorativo */}
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none">
                        <svg className="w-80 h-80 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"/>
                        </svg>
                    </div>

                    {/* Contenido central */}
                    <div className="flex-1 flex flex-col items-center justify-center px-12 gap-3 relative z-10">
                        <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-sm">Llamado Actual</p>

                        <AnimatePresence mode="wait">
                            {turnoActual ? (
                            <motion.div
                                key={turnoActual.id}
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -30, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                                className="flex flex-col items-center gap-5 w-full"
                            >
                                <motion.span
                                    animate={ring ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 0.4, type: "spring" }}
                                    className="font-black text-[#0B3D2E] tracking-tighter leading-none"
                                    style={{ fontSize: '14rem' }}
                                >
                                    {turnoActual.turno}
                                </motion.span>

                                {/* Taquilla */}
                                <div className="w-full max-w-xs bg-[#39A900] rounded-2xl py-5 flex flex-col items-center shadow-lg shadow-green-200">
                                    <span className="text-white font-black uppercase tracking-widest text-2xl">{turnoActual.taquilla || 'En espera'}</span>
                                    <span className="text-white/70 text-xs uppercase tracking-widest font-bold mt-1">Diríjase a este módulo</span>
                                </div>

                                {/* Instrucción */}
                                <div className="flex items-center gap-2 border-2 border-gray-100 rounded-full px-6 py-2.5 text-gray-500 text-sm font-bold bg-gray-50">
                                    <svg className="w-4 h-4 text-[#39A900]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Diríjase al módulo indicado
                                </div>
                            </motion.div>
                            ) : (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 text-center">
                                <span className="text-8xl">🕐</span>
                                <p className="text-2xl font-black text-gray-300 uppercase tracking-widest">Sin turnos activos</p>
                                <p className="text-gray-400 font-medium">Los turnos aparecerán aquí automáticamente</p>
                            </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Indicador llamado activo */}
                    <AnimatePresence>
                        {ring && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#39A900] text-white px-8 py-3 rounded-full shadow-lg shadow-green-200"
                            >
                                <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}
                                    className="w-2.5 h-2.5 rounded-full bg-white" />
                                <span className="font-black uppercase tracking-widest text-sm">Llamado en curso</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* PANEL DERECHO — ÚLTIMOS TURNOS */}
                <div className="flex-[4] bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-[#F4F6F9]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#39A900]/10 rounded-xl">
                                <svg className="w-5 h-5 text-[#39A900]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="font-black text-[#0B3D2E] uppercase tracking-widest text-sm">Últimos Turnos</span>
                        </div>
                        <span className="bg-[#39A900] text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">En sala</span>
                    </div>

                    {/* Columnas */}
                    <div className="grid grid-cols-3 px-8 py-3 border-b border-gray-100">
                        <span className="text-gray-400 text-xs font-black uppercase tracking-widest">Turno</span>
                        <span className="text-gray-400 text-xs font-black uppercase tracking-widest text-center">Taquilla</span>
                        <span className="text-gray-400 text-xs font-black uppercase tracking-widest text-right">Estado</span>
                    </div>

                    {/* Filas */}
                    <div className="flex flex-col flex-1 overflow-hidden px-8 py-4 gap-1">
                        <AnimatePresence>
                            {historial.map((item) => {
                                const c = tipoConfig[item.tipo] || tipoConfig['General'];
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                        className="grid grid-cols-3 items-center py-5 border-b border-gray-50 last:border-0"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-black text-[#0B3D2E]" style={{ fontSize: '2.4rem', lineHeight: 1 }}>{item.turno}</span>
                                            <span className={`text-xs font-bold uppercase tracking-wider mt-1 ${c.text}`}>{item.tipo}</span>
                                        </div>
                                        <div className="flex justify-center">
                                            <span className="font-bold text-gray-600 text-lg">{item.taquilla}</span>
                                        </div>
                                        <div className="flex justify-end items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${item.estado === 'Atendiendo' ? 'bg-[#39A900] animate-pulse' : 'bg-gray-300'}`} />
                                            <span className={`text-sm font-bold ${item.estado === 'Atendiendo' ? 'text-[#39A900]' : 'text-gray-400'}`}>
                                                {item.estado}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* TICKER INFERIOR */}
            <div className="bg-[#0B3D2E] shrink-0 flex items-center overflow-hidden" style={{ height: '42px' }}>
                <div className="bg-[#39A900] text-white font-black uppercase tracking-widest text-xs px-6 h-full flex items-center shrink-0 shadow-md">
                    Atención
                </div>
                <div className="flex-1 overflow-hidden relative h-full flex items-center">
                    <motion.span
                        animate={{ x: ['100vw', '-100%'] }}
                        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                        className="whitespace-nowrap text-white/70 text-xs font-medium absolute"
                    >
                        {tickerMsg} {tickerMsg}
                    </motion.span>
                </div>
                <div className="bg-[#39A900] text-white font-black uppercase tracking-widest text-xs px-6 h-full flex items-center shrink-0 cursor-pointer hover:bg-[#2d8600] transition-colors">
                    Avisos
                </div>
            </div>
        </div>
    );
}
