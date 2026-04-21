# 🚀 Digiturno - SENA APE Control System

Sistema de gestión de turnos de alto rendimiento diseñado específicamente para la **Agencia Pública de Empleo (APE) del SENA**. Esta plataforma moderna optimiza la interacción entre buscadores de empleo y asesores mediante una interfaz intuitiva, automatizada y con una estética premium.

## 🌟 Características Principales

### 💎 Interfaz de Usuario Premium
- **Diseño Glassmorphism**: Uso extendido de efectos de cristal, desenfoques y gradientes modernos para una experiencia de usuario de "vanguardia".
- **Animaciones Cinematográficas**: Integración de **Framer Motion** y **GSAP** para transiciones suaves y estados interactivos que cautivan al usuario.
- **Teclado Virtual Personalizado**: Formulario de registro con keypad numérico integrado y respuesta táctil para kioscos.

### 🤖 Automatización y Flujo de Atención
- **Asesor Inteligente**: El dashboard del asesor elimina pasos redundantes. El llamado de turnos es automático al finalizar la atención previa.
- **Mock Mode**: El frontend está desacoplado de la base de datos para permitir desarrollo rápido de UI sin depender de conexiones activas.
- **Roles Definidos**: Separación clara entre **Asesores** (atención directa) y **Coordinadores** (supervisión global).

### 🛠️ Tecnología de Punta
- **Frontend**: React 18 con Inertia.js (Single Page Application experience).
- **Styling**: Tailwind CSS con fuentes modernas (Inter & Poppins).
- **Backend**: Laravel 11/12 proporcionando una API robusta y segura.
- **Iconografía**: Lucide React para una interfaz limpia y semántica.

---

## 🚀 Logros del Proyecto

### 1. Modernización de Componentes
- Reconstrucción total de las pantallas de **Bienvenida**, **Selección de Población** y **Registro**.
- Implementación de lógica de redirección inteligente hacia el "Welcome" al finalizar cada proceso.

### 2. Optimización del Dashboard del Asesor
- Eliminación del botón manual "Siguiente Turno".
- Implementación de **Llamado Automático** (400ms tras asignación).
- Animaciones de éxito mediante **Lottie Player** para confirmación visual de tareas completadas.

### 3. Gestión de Datos y Consistencia
- Normalización de etiquetas de atención: *Atención Prioritaria*, *Empresa*, *Población General* y *Víctimas*.
- Refactorización del modelo de Usuario para máxima visibilidad de roles (Asesor vs Coordinador).

---

## 🛠️ Instalación y Desarrollo

1. **Clonar el repositorio:**
   ```bash
   git clone [url-del-repo]
   ```

2. **Instalar dependencias:**
   ```bash
   composer install
   npm install
   ```

3. **Configurar entorno:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

---
*Desarrollado con ❤️ para el talento colombiano en el SENA.*
