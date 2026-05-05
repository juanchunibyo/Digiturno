import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { HeartHandshake, Accessibility, Users, Building2, ChevronRight } from 'lucide-react';

export default function SeleccionPoblacion() {
    // Definimos las tarjetas con los colores solicitados por el usuario
    const cards = [
        {
            title: "Población Víctima",
            desc: "Atención especializada para víctimas del conflicto armado.",
            icon: HeartHandshake,
            link: "/registro?tipo=Víctimas",
            baseColor: "#F97316", // Naranja
            gradient: "from-orange-500 to-red-600",
            shadow: "shadow-orange-500/20"
        },
        {
            title: "Población Prioridad",
            desc: "Adultos mayores, personas con discapacidad o mujeres gestantes.",
            icon: Accessibility,
            link: "/registro?tipo=Prioritaria",
            baseColor: "#EAB308", // Amarillo Mostaza
            gradient: "from-yellow-500 to-amber-600",
            shadow: "shadow-yellow-500/20"
        },
        {
            title: "Población General",
            desc: "Registro, postulación a vacantes y orientación laboral general.",
            icon: Users,
            link: "/registro?tipo=General",
            baseColor: "#39A900", // Verde SENA
            gradient: "from-[#39A900] to-[#1B4332]",
            shadow: "shadow-green-500/20"
        },
        {
            title: "Atención Empresas",
            desc: "Gestión de vacantes y apoyo corporativo para empleadores.",
            icon: Building2,
            link: "/registro?tipo=Empresa",
            baseColor: "#0EA5E9", // Azul
            gradient: "from-blue-500 to-cyan-600",
            shadow: "shadow-blue-500/20"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 60, opacity: 0, scale: 0.95 },
        show: { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 } 
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col font-['Inter',sans-serif] select-none overflow-hidden bg-[#0a1a14] selection:bg-[#39A900] selection:text-white">
            <Head title="Selección de Población | SENA APE" />

            {/* FONDOS Y EFECTOS REALISTAS */}
            <div className="absolute inset-0 z-0">
                <motion.img
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.4 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    alt="Fondo SENA"
                    className="w-full h-full object-cover"
                    src="/ape-bg.png" 
                />
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#39A900]/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1a14] via-[#0B3D2E]/80 to-black/90 backdrop-blur-[1px]"></div>
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </div>

            {/* Top Navigation */}
            <header className="relative w-full flex justify-between items-center px-6 md:px-12 py-6 md:py-8 z-20">
                <motion.div 
                    initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}
                    className="flex items-center bg-white/[0.03] backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                    <img src="/logo-ape.png" alt="SENA" className="h-10 md:h-12 object-contain brightness-0 invert" />
                </motion.div>

                <motion.div 
                    initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}
                    className="hidden md:flex flex-col items-end gap-3 bg-black/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-2xl min-w-[320px]">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] uppercase font-black text-[#5ceb00] tracking-[0.2em]">Paso 1: Identificación</span>
                        <span className="text-[11px] font-black text-white/50">Progreso 50%</span>
                    </div>
                    <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden flex p-[2px] border border-white/5">
                        <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ delay: 0.5, duration: 1 }} className="bg-[#39A900] h-full rounded-full" />
                    </div>
                </motion.div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
                <motion.div 
                    initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                    className="text-center mb-10 md:mb-16 max-w-5xl">
                    <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.95] drop-shadow-2xl">
                        ¿Cómo podemos <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39A900] to-[#5ceb00]">ayudarte hoy?</span>
                    </h1>
                </motion.div>

                {/* Cards Container */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10 max-w-[1700px] w-full px-4">

                    {cards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                        <motion.div key={index} variants={itemVariants} className="group">
                            <Link 
                                href={card.link} 
                                className="relative flex flex-col h-full rounded-[48px] overflow-hidden bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-2xl transition-all duration-500 hover:border-white/20 active:scale-[0.97] touch-manipulation">
                                
                                <div className="relative flex-1 p-8 md:p-10 lg:p-12 flex flex-col items-center text-center pb-12 lg:pb-16">
                                    {/* Icon Container con el color solicitado */}
                                    <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-[32px] md:rounded-[40px] flex items-center justify-center mb-8 md:mb-12 transition-all duration-500 group-hover:scale-110 shadow-2xl border border-white/10 overflow-hidden">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-20`} />
                                        <Icon className="relative z-10 transition-all duration-500" size={48} style={{ color: card.baseColor }} strokeWidth={1.5} />
                                    </div>

                                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight tracking-tighter" style={{ color: 'white' }}>
                                        {card.title.split(' ').map((word, i) => (
                                            <span key={i}>
                                                {i === 1 ? <span style={{ color: card.baseColor }} className="block md:inline">{word}</span> : word + ' '}
                                            </span>
                                        ))}
                                    </h3>
                                    <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed max-w-[240px] mx-auto opacity-80 group-hover:opacity-100 transition-opacity">
                                        {card.desc}
                                    </p>
                                </div>

                                {/* Botón "Seleccionar" con fondo VERDE solicitado */}
                                <div className="relative mt-auto py-8 lg:py-10 text-center font-black tracking-[0.25em] uppercase text-sm md:text-base border-t border-white/5 bg-[#39A900] text-white flex items-center justify-center gap-3 group-hover:bg-[#45cc00] transition-colors">
                                    <span>Seleccionar</span>
                                    <ChevronRight className="group-hover:translate-x-2 transition-transform" size={20} />
                                </div>
                            </Link>
                        </motion.div>
                        );
                    })}
                </motion.div>
            </main>

            <footer className="relative z-10 py-8 px-12 flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                <span>SENA Agencia Pública de Empleo</span>
                <span>Cerca de lo que quieres ser</span>
            </footer>
        </div>
    );
}
