import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { HeartHandshake, Accessibility, Users, Building2, Globe, Volume2, Contrast } from 'lucide-react';

export default function SeleccionPoblacion() {
    // Definimos las tarjetas para mapearlas fácilmente con Framer Motion (stagger)
    const cards = [
        {
            title: "Población Víctima",
            desc: "Atención especializada para víctimas del conflicto armado.",
            icon: HeartHandshake,
            link: "/registro?tipo=Víctimas"
        },
        {
            title: "Población Prioridad",
            desc: "Adultos mayores, personas con discapacidad o mujeres gestantes.",
            icon: Accessibility,
            link: "/registro?tipo=Prioritaria"
        },
        {
            title: "Población General",
            desc: "Registro, postulación a vacantes y orientación laboral general.",
            icon: Users,
            link: "/registro?tipo=General"
        },
        {
            title: "Atención Empresas",
            desc: "Gestión de vacantes y apoyo corporativo para empleadores.",
            icon: Building2,
            link: "/registro?tipo=Empresa"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 50, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4 } }
    };

    return (
        <div className="relative min-h-screen flex flex-col font-['Inter',sans-serif] select-none overflow-hidden bg-[#1B4332] selection:bg-[#39A900] selection:text-white">
            <Head title="Selección de Población | SENA APE" />

            <div className="absolute inset-0 z-0">
                <motion.img
                    initial={{ scale: 1.05, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    alt="Fondo SENA"
                    className="w-full h-full object-cover"
                    src="/ape-bg.png" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-[#1B4332]/70 to-black/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Top Navigation - Glassmorphism */}
            <header className="relative w-full flex justify-between items-center px-10 py-6 z-20">
                <motion.div 
                    initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="flex items-center bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
                    <img src="/logo-ape.png" alt="SENA Agencia Pública de Empleo" className="h-[46px] object-contain drop-shadow-md brightness-0 invert" />
                </motion.div>

                <motion.div 
                    initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="flex flex-col items-end gap-3 z-10 w-[300px] bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] uppercase font-bold text-[#5ceb00] tracking-widest">Paso: Selección de Atención</span>
                        <span className="text-[10px] font-bold text-white/70">1 de 2</span>
                    </div>
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                        <div className="bg-gradient-to-r from-[#39A900] to-[#5ceb00] w-1/2 h-full rounded-full drop-shadow-md"></div>
                    </div>
                </motion.div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="text-center mb-16 mt-[-40px] max-w-3xl">
                    <h1 className="text-4xl md:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-tight drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                        Por favor, seleccione el tipo de atención que requiere hoy
                    </h1>
                </motion.div>

                {/* Cards Container */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-[1600px] w-full justify-center px-4">

                    {cards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                        <motion.div key={index} variants={itemVariants} className="w-full flex">
                            <Link 
                                href={card.link} 
                                className="group flex flex-col w-full rounded-[40px] overflow-hidden bg-white/5 backdrop-blur-xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-4 hover:shadow-[0_30px_60px_rgba(57,169,0,0.2)] hover:border-[#39A900]/50 hover:bg-white/10 transition-all duration-300 active:scale-95 touch-manipulation">
                                
                                <div className="flex-1 p-6 lg:p-10 flex flex-col items-center text-center pb-12 justify-center">
                                    <div className="w-[90px] h-[90px] lg:w-[110px] lg:h-[110px] rounded-[30px] rotate-3 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center mb-8 backdrop-blur-md group-hover:rotate-0 group-hover:scale-110 transition-all duration-300 shadow-lg border border-white/30">
                                        <Icon className="text-[#5ceb00] group-hover:text-white transition-colors" size={54} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-[28px] lg:text-[34px] font-black text-white mb-4 leading-[1.1] tracking-tight">{card.title}</h3>
                                    <p className="text-[15px] lg:text-[16px] text-gray-300 font-medium leading-relaxed drop-shadow-md">{card.desc}</p>
                                </div>
                                <div className="bg-black/40 backdrop-blur-md py-6 lg:py-7 text-center text-white/90 font-black tracking-[0.2em] uppercase group-hover:bg-[#39A900] group-hover:text-white transition-colors text-lg lg:text-xl shadow-inner border-t border-white/10">
                                    Seleccionar
                                </div>
                            </Link>
                        </motion.div>
                        );
                    })}
                    
                </motion.div>
            </main>

        </div>
    );
}
