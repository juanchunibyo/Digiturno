<?php

use App\Http\Controllers\ProfileController;
use App\Models\Asesor;
use App\Models\Atencion;
use App\Models\Turno;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Carbon\Carbon;

Route::redirect('/', '/kiosko');

Route::prefix('kiosko')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Kiosko');
    })->name('kiosko.index');
});

// Redirecciones de compatibilidad para evitar errores 404 o 405
Route::get('/seleccion', fn() => redirect()->route('kiosko.index'));
Route::get('/registro', fn() => redirect()->route('kiosko.index'));
Route::get('/turno/generar', fn() => redirect()->route('kiosko.index')); // Evita el error GET en ruta POST

Route::post('/turno/generar', [\App\Http\Controllers\TurnoController::class, 'store'])->name('turno.generar');

// RUTA TEMPORAL PARA CREAR USUARIO (Borrar después de usar)
Route::get('/setup-victimas', function() {
    $user = \App\Models\User::updateOrCreate(
        ['email' => 'victimas@sena.edu.co'],
        [
            'name' => 'Asesor Víctimas',
            'password' => Hash::make('victimas2026'),
            'role' => 'victimas'
        ]
    );
    return "Usuario Creado: victimas@sena.edu.co | Pass: victimas2026 | Rol: victimas. Ya puedes cerrar esta pestaña.";
});

// RUTA PARA CAMBIAR TU PROPIO ROL A VÍCTIMA
Route::get('/soy-victima', function() {
    $user = request()->user();
    if (!$user) return "Debes estar logueado primero.";
    
    $user->update(['role' => 'victimas']);
    
    // También asegurar que tenga el registro en la tabla de asesores como especialista
    \App\Models\Asesor::updateOrCreate(
        ['user_id' => $user->id],
        ['tipo_asesor' => 'Víctimas', 'taquilla' => 'Taquilla Especializada']
    );

    return redirect()->route('dashboard.victimas');
})->middleware(['auth']);

// ============================================================
//  API JSON para la Pantalla de Turnos (polling)
// ============================================================
Route::get('/pantalla/turnos', function () {
    // Todos los turnos "En Curso" (actual)
    $enCurso = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->whereIn('atenciones.estado', ['Llamando', 'En Curso'])
        ->orderBy('atenciones.id', 'desc')
        ->select('turnos.id','turnos.turno_numero','turnos.tipo','asesores.taquilla','atenciones.estado','atenciones.updated_at')
        ->first();

    // Turnos EN ESPERA (Los que todavía no han sido llamados)
    $enEspera = DB::table('turnos')
        ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
        ->whereNull('atenciones.id')
        ->whereDate('turnos.created_at', today())
        ->orderBy('turnos.id', 'asc')
        ->limit(6)
        ->select('turnos.turno_numero', 'turnos.tipo')
        ->get()
        ->map(fn($t) => [
            'turno' => $t->turno_numero,
            'tipo'  => $t->tipo,
        ]);

    // Historial reciente (últimos 4 completados/no asistió)
    $historial = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->whereIn('atenciones.estado', ['Completado', 'No Asistió'])
        ->whereDate('atenciones.created_at', today())
        ->orderBy('atenciones.id', 'desc')
        ->limit(4)
        ->select('turnos.id','turnos.turno_numero','turnos.tipo','asesores.taquilla','atenciones.estado')
        ->get()
        ->map(fn($t) => [
            'id'       => $t->id,
            'turno'    => $t->turno_numero,
            'tipo'     => $t->tipo,
            'taquilla' => $t->taquilla,
            'estado'   => $t->estado,
        ]);

    return response()->json([
        'actual' => $enCurso ? [
            'id'      => $enCurso->id,
            'turno'   => $enCurso->turno_numero,
            'tipo'    => $enCurso->tipo,
            'taquilla'=> $enCurso->taquilla,
            'estado'  => $enCurso->estado,
            'updated_at' => $enCurso->updated_at,
        ] : null,
        'enEspera' => $enEspera,
        'historial' => $historial,
    ]);
});

// Agregamos ruta para el check-in del asesor
Route::post('/asesor/checkin', function (Illuminate\Http\Request $request) {
    DB::table('atenciones')
        ->where('id', $request->atencion_id)
        ->update(['estado' => 'En Curso', 'updated_at' => now()]);
    return back();
})->middleware(['auth', 'verified'])->name('asesor.checkin');

// ============================================================
//  Pantalla de Turnos (vista Inertia)
// ============================================================
Route::get('/pantalla', function () {
    // Turno Actual (Llamando o En Curso)
    $enCurso = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->whereIn('atenciones.estado', ['Llamando', 'En Curso'])
        ->orderBy('atenciones.id', 'desc')
        ->select('turnos.id','turnos.turno_numero','turnos.tipo','asesores.taquilla','atenciones.estado','atenciones.updated_at')
        ->first();

    // Turnos EN ESPERA
    $enEspera = DB::table('turnos')
        ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
        ->whereNull('atenciones.id')
        ->whereDate('turnos.created_at', today())
        ->orderBy('turnos.id', 'asc')
        ->limit(6)
        ->select('turnos.turno_numero', 'turnos.tipo')
        ->get()
        ->map(fn($t) => [
            'turno' => $t->turno_numero,
            'tipo'  => $t->tipo,
        ]);

    // Historial
    $historial = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->whereIn('atenciones.estado', ['Completado', 'No Asistió'])
        ->whereDate('atenciones.created_at', today())
        ->orderBy('atenciones.id', 'desc')
        ->limit(4)
        ->select('turnos.id','turnos.turno_numero','turnos.tipo','asesores.taquilla','atenciones.estado')
        ->get()
        ->map(fn($t) => [
            'id'       => $t->id,
            'turno'    => $t->turno_numero,
            'tipo'     => $t->tipo,
            'taquilla' => $t->taquilla,
            'estado'   => $t->estado,
        ]);

    return Inertia::render('PantallaTurnos', [
        'turnoActualInicial' => $enCurso ? [
            'id'      => $enCurso->id,
            'turno'   => $enCurso->turno_numero,
            'tipo'    => $enCurso->tipo,
            'taquilla'=> $enCurso->taquilla,
            'estado'  => $enCurso->estado,
            'updated_at' => $enCurso->updated_at,
        ] : null,
        'enEsperaInicial' => $enEspera,
        'historialInicial' => $historial,
    ]);
});

// ============================================================
//  Dashboard Asesor
// ============================================================
Route::get('/dashboard-asesor', function () {
    $user   = request()->user();
    $asesor = Asesor::where('user_id', $user->id)->first();

    if (!$asesor) {
        $asesor = Asesor::create([
            'user_id'    => $user->id,
            'taquilla'   => 'Taquilla 01',
            'tipo_asesor'=> 'General',
        ]);
    }

    // --- ASIGNACIÓN AUTOMÁTICA MEJORADA ---
    $atencionActivaRecord = DB::table('atenciones')
        ->where('asesor_id', $asesor->id)
        ->whereIn('estado', ['Llamando', 'En Curso'])
        ->first();

    if (!$atencionActivaRecord && $asesor->tipo_asesor !== 'Víctimas') {
        $querySiguiente = DB::table('turnos')
            ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
            ->whereNull('atenciones.id')
            ->whereDate('turnos.created_at', today())
            ->orderBy('turnos.id', 'asc');

        if ($asesor->tipo_asesor && $asesor->tipo_asesor !== 'General') {
            $querySiguiente->where('turnos.tipo', $asesor->tipo_asesor);
        }

        $siguiente = $querySiguiente->select('turnos.id', 'turnos.tipo')->first();

        if ($siguiente) {
            $atencionActivaRecord = Atencion::create([
                'turno_id'    => $siguiente->id,
                'asesor_id'   => $asesor->id,
                'tipo'        => $siguiente->tipo,
                'hora_inicio' => now(),
                'estado'      => 'Llamando',
            ]);
        }
    }

    // Atención activa del asesor (Asignada por el Coordinador o por flujo previo)
    $atencionActiva = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->leftJoin('solicitantes', 'turnos.solicitante_id', '=', 'solicitantes.id')
        ->leftJoin('personas', 'solicitantes.persona_id', '=', 'personas.id')
        ->where('atenciones.asesor_id', $asesor->id)
        ->whereIn('atenciones.estado', ['Llamando', 'En Curso'])
        ->select('atenciones.*', 'turnos.turno_numero', 'turnos.tipo', 'personas.documento')
        ->first();

    // Turnos en espera (Solo para visualización)
    $turnosEnEspera = DB::table('turnos')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado', ['Llamando', 'En Curso', 'Completado', 'No Asistió']);
        })
        ->leftJoin('solicitantes', 'turnos.solicitante_id', '=', 'solicitantes.id')
        ->leftJoin('personas', 'solicitantes.persona_id', '=', 'personas.id')
        ->whereNull('atenciones.id')
        ->whereDate('turnos.created_at', today())
        ->orderBy('turnos.id', 'asc')
        ->select('turnos.*', 'personas.documento')
        ->get()
        ->map(fn($t) => [
            'id'       => $t->id,
            'turn'     => $t->turno_numero,
            'tipo'     => $t->tipo,
            'doc'      => $t->documento ?? '--',
            'timeWait' => Carbon::parse($t->hora_fecha)->diffForHumans(),
        ]);

    $asesor->update(['last_activity' => now()]);

    // Historial del asesor (hoy)
    $historialAsesor = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->leftJoin('solicitantes', 'turnos.solicitante_id', '=', 'solicitantes.id')
        ->leftJoin('personas', 'solicitantes.persona_id', '=', 'personas.id')
        ->where('atenciones.asesor_id', $asesor->id)
        ->whereIn('atenciones.estado', ['Completado', 'No Asistió'])
        ->whereDate('atenciones.created_at', today())
        ->orderBy('atenciones.id', 'desc')
        ->select(
            'turnos.turno_numero',
            'turnos.tipo',
            'personas.documento',
            'atenciones.observaciones',
            'atenciones.estado',
            'atenciones.hora_inicio',
            'atenciones.hora_fin'
        )
        ->get()
        ->map(function($row) {
            $duracion = '--';
            if ($row->hora_inicio && $row->hora_fin) {
                $diff = Carbon::parse($row->hora_inicio)->diff(Carbon::parse($row->hora_fin));
                $duracion = sprintf('%02d:%02d', $diff->i, $diff->s);
            }
            return [
                'turn'     => $row->turno_numero,
                'doc'      => $row->documento ?? '--',
                'type'     => $row->tipo,
                'duration' => $duracion,
                'obs'      => $row->observaciones ?: '--',
                'status'   => strtoupper($row->estado),
            ];
        })
        ->values()
        ->toArray();

    // Estadísticas del día
    $statsHoyData = DB::table('atenciones')
        ->where('asesor_id', $asesor->id)
        ->whereDate('created_at', today())
        ->whereIn('estado', ['Completado', 'No Asistió'])
        ->selectRaw('COUNT(*) as total, AVG(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as promedio_seg')
        ->first();

    return Inertia::render('Dashboard', [
        'asesor'         => $asesor,
        'turnosEnEspera' => $turnosEnEspera,
        'atencionActiva' => $atencionActiva ? [
            'id'            => $atencionActiva->id,
            'turno_id'      => $atencionActiva->turno_id,
            'turno_numero'  => $atencionActiva->turno_numero,
            'tipo'          => $atencionActiva->tipo,
            'documento'     => $atencionActiva->documento ?? '--',
            'hora_inicio'   => $atencionActiva->hora_inicio,
            'observaciones' => $atencionActiva->observaciones,
        ] : null,
        'historialAsesor' => $historialAsesor,
        'statsHoy'        => [
            'total'    => $statsHoyData->total ?? 0,
            'promedio' => $statsHoyData->promedio_seg ? round($statsHoyData->promedio_seg / 60) : 0,
        ],
        'mensajeCoordinador' => $asesor->mensaje_coordinador,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard.asesor');

Route::post('/asesor/rellamar', function (Illuminate\Http\Request $request) {
    DB::table('atenciones')
        ->where('id', $request->atencion_id)
        ->update(['updated_at' => now()]);
    return back();
})->middleware(['auth', 'verified'])->name('asesor.rellamar');

// ============================================================
//  Coordinador: ASIGNAR TURNO MANUALMENTE
// ============================================================
Route::post('/coordinador/asignar-turno', function () {
    if (request()->user()->role !== 'coordinador') abort(403);

    $turnoId  = request('turno_id');
    $asesorId = request('asesor_id');

    // Verificar si el asesor ya tiene una atención activa
    $yaAtendiendo = Atencion::where('asesor_id', $asesorId)
        ->where('estado', 'En Curso')
        ->exists();

    if ($yaAtendiendo) {
        return back()->with('error', 'El asesor ya tiene un turno en curso.');
    }

    Atencion::create([
        'turno_id'    => $turnoId,
        'asesor_id'   => $asesorId,
        'tipo'        => Turno::find($turnoId)?->tipo ?? 'General',
        'hora_inicio' => now(),
        'estado'      => 'En Curso',
    ]);

    return back();
})->middleware(['auth', 'verified'])->name('coordinador.asignar');

Route::post('/coordinador/cambiar-taquilla', function () {
    if (request()->user()->role !== 'coordinador') abort(403);
    $asesor = Asesor::find(request('asesor_id'));
    if ($asesor) {
        $asesor->update(['taquilla' => request('taquilla')]);
    }
    return back();
})->middleware(['auth', 'verified'])->name('coordinador.taquilla');

Route::post('/coordinador/toggle-activo', function () {
    if (request()->user()->role !== 'coordinador') abort(403);
    $asesor = Asesor::find(request('asesor_id'));
    if ($asesor) {
        $asesor->update(['activo' => !$asesor->activo]);
    }
    return back();
})->middleware(['auth', 'verified'])->name('coordinador.toggle-activo');

Route::post('/coordinador/enviar-mensaje', function () {
    if (request()->user()->role !== 'coordinador') abort(403);
    $asesor = Asesor::find(request('asesor_id'));
    if ($asesor) {
        $asesor->update(['mensaje_coordinador' => request('mensaje')]);
    }
    return back();
})->middleware(['auth', 'verified'])->name('coordinador.enviar-mensaje');

Route::post('/asesor/limpiar-mensaje', function () {
    $user = request()->user();
    $asesor = Asesor::where('user_id', $user->id)->first();
    if ($asesor) {
        $asesor->update(['mensaje_coordinador' => null]);
    }
    return back();
})->middleware(['auth', 'verified'])->name('asesor.limpiar-mensaje');

// ============================================================
//  Asesor: Llamar Turno
// ============================================================
Route::post('/asesor/llamar-turno', function () {
    $user   = request()->user();
    $asesor = Asesor::where('user_id', $user->id)->first();
    $turnoId = request('turno_id');

    Atencion::create([
        'turno_id'   => $turnoId,
        'asesor_id'  => $asesor->id,
        'tipo'       => Turno::find($turnoId)?->tipo ?? 'General',
        'hora_inicio'=> now(),
        'estado'     => 'En Curso',
    ]);

    return back();
})->middleware(['auth', 'verified'])->name('asesor.llamar');

// ============================================================
//  Asesor: Finalizar Turno (+ auto-eliminación del turno)
// ============================================================
Route::post('/asesor/finalizar-turno', function () {
    $user   = request()->user();
    $asesor = Asesor::where('user_id', $user->id)->first();
    $estado = request('estado', 'Completado');

    $atencion = Atencion::where('asesor_id', $asesor->id)
        ->where('estado', 'En Curso')
        ->first();

    if ($atencion) {
        $atencion->update([
            'estado'        => $estado,
            'hora_fin'      => now(),
            'observaciones' => request('observaciones'),
        ]);

        /* 
        ELIMINADO: Ya no borramos el turno al finalizar para poder mantener un historial 
        de atenciones durante el día. El turno deja de aparecer en "Espera" automáticamente 
        al cambiar su estado a 'Completado' o 'No Asistió'.
        */

        // --- ASIGNACIÓN AUTOMÁTICA INTELIGENTE (Estrategia 2x1) ---
        // 1. Los asesores de "Víctimas" NO reciben turnos automáticos
        if ($asesor->tipo_asesor !== 'Víctimas') {
            
            // Consultar los últimos 3 turnos atendidos globalmente (excluyendo Víctimas)
            $ultimasAtenciones = DB::table('atenciones')
                ->where('tipo', '!=', 'Víctimas')
                ->whereDate('created_at', today())
                ->orderBy('id', 'desc')
                ->take(3)
                ->pluck('tipo');

            // Contar cuántos prioritarios hubo en los últimos 3
            $prioritariosEnLinea = $ultimasAtenciones->filter(fn($t) => str_contains(strtolower($t), 'priorit'))->count();
            
            // Lógica 2x1: Si ya atendimos 2 prioritarios seguidos, buscamos uno General/Empresa
            $forzarGeneral = ($prioritariosEnLinea >= 2);

            $query = DB::table('turnos')
                ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
                ->whereNull('atenciones.id')
                ->where('turnos.tipo', '!=', 'Víctimas')
                ->whereDate('turnos.created_at', today())
                ->orderBy('turnos.id', 'asc');

            if ($forzarGeneral) {
                // Forzamos buscar uno que NO sea prioritario
                $query->where('turnos.tipo', 'NOT LIKE', '%Prioritaria%');
            } else {
                // Si no hay que forzar general, intentamos priorizar Prioritaria si hay disponibles
                $hayPrioritarios = (clone $query)->where('turnos.tipo', 'LIKE', '%Prioritaria%')->exists();
                if ($hayPrioritarios) {
                    $query->where('turnos.tipo', 'LIKE', '%Prioritaria%');
                }
            }

            // Aplicar especialidad del asesor si no es General
            if ($asesor->tipo_asesor && $asesor->tipo_asesor !== 'General') {
                $query->where('turnos.tipo', $asesor->tipo_asesor);
            }

            $siguienteTurno = $query->select('turnos.id', 'turnos.tipo')->first();

            // Si no encontramos nada con la restricción forzada, intentamos buscar cualquier cosa (excepto víctimas)
            if (!$siguienteTurno) {
                $siguienteTurno = DB::table('turnos')
                    ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
                    ->whereNull('atenciones.id')
                    ->where('turnos.tipo', '!=', 'Víctimas')
                    ->whereDate('turnos.created_at', today())
                    ->orderBy('turnos.id', 'asc')
                    ->select('turnos.id', 'turnos.tipo')
                    ->first();
            }

            if ($siguienteTurno) {
                Atencion::create([
                    'turno_id'    => $siguienteTurno->id,
                    'asesor_id'   => $asesor->id,
                    'tipo'        => $siguienteTurno->tipo,
                    'hora_inicio' => now(),
                    'estado'      => 'Llamando',
                ]);
            }
        }
    }

    return back();
})->middleware(['auth', 'verified'])->name('asesor.finalizar');

// ============================================================
//  Dashboard Coordinador (datos reales)
// ============================================================
Route::get('/dashboard-coordinador', function () {
    if (request()->user()->role !== 'coordinador') {
        abort(403, 'Acceso Restringido: Esta área es solo para Coordinadores.');
    }

    // KPIs reales
    $turnosEnEsperaCount = DB::table('turnos')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado', ['En Curso', 'Completado', 'No Asistió']);
        })
        ->whereNull('atenciones.id')
        ->whereDate('turnos.created_at', today())
        ->count();

    $tiempoPromedio = DB::table('atenciones')
        ->whereDate('created_at', today())
        ->where('estado', 'Completado')
        ->whereNotNull('hora_inicio')
        ->whereNotNull('hora_fin')
        ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as promedio')
        ->value('promedio');

    $totalAsesores  = DB::table('asesores')->count();
    $asesoresActivos = DB::table('atenciones')
        ->whereIn('estado', ['Llamando', 'En Curso'])
        ->distinct('asesor_id')
        ->count('asesor_id');

    $atencionesHoyCount = DB::table('atenciones')
        ->whereDate('created_at', today())
        ->whereIn('estado', ['Completado', 'No Asistió'])
        ->count();

    // Asesores con su estado actual
    $asesoresData = DB::table('asesores')
        ->join('users', 'asesores.user_id', '=', 'users.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('asesores.id', '=', 'atenciones.asesor_id')
                 ->whereIn('atenciones.estado', ['Llamando', 'En Curso']);
        })
        ->leftJoin('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->select(
            'asesores.id',
            'users.name',
            'asesores.taquilla',
            'asesores.activo',
            'atenciones.estado as atencion_estado',
            'turnos.turno_numero',
            'atenciones.hora_inicio',
            'asesores.last_activity'
        )
        ->get()
        ->map(function($a) {
            $isOnline = $a->last_activity && Carbon::parse($a->last_activity)->diffInSeconds(now()) < 20;
            $status = !$isOnline ? 'OFFLINE' : (in_array($a->atencion_estado, ['Llamando', 'En Curso']) ? 'ATENDIENDO' : 'DISPONIBLE');
            $timeInSeconds = 0;
            if ($a->hora_inicio) {
                $timeInSeconds = Carbon::parse($a->hora_inicio)->diffInSeconds(now());
            }
            $m = str_pad(intdiv($timeInSeconds, 60), 2, '0', STR_PAD_LEFT);
            $s = str_pad($timeInSeconds % 60, 2, '0', STR_PAD_LEFT);
            return [
                'id'       => $a->id,
                'name'     => $a->name,
                'box'      => $a->taquilla ?? 'Sin asignar',
                'status'   => $status,
                'isOnline' => $isOnline,
                'activo'   => $a->activo ?? true,
                'turn'     => $a->turno_numero ?? '--',
                'time'     => (in_array($a->atencion_estado, ['Llamando', 'En Curso'])) ? "$m:$s" : '--',
                'timeInSeconds' => (int)$timeInSeconds,
                'avatar'   => collect(explode(' ', $a->name))->map(fn($w) => strtoupper(mb_substr($w, 0, 1)))->take(2)->implode(''),
            ];
        })
        ->values()
        ->toArray();

    // Ciudadanos en espera con detalle
    $ciudadanosEnEspera = DB::table('turnos')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado', ['En Curso', 'Completado', 'No Asistió']);
        })
        ->whereNull('atenciones.id')
        ->whereDate('turnos.created_at', today())
        ->orderBy('turnos.id', 'asc')
        ->select('turnos.*')
        ->limit(10)
        ->get()
        ->map(function($t) {
            $waitMinutes = (int) Carbon::parse($t->created_at)->diffInMinutes(now());
            return [
                'id'       => $t->id,
                'turn'     => $t->turno_numero,
                'type'     => $t->tipo,
                'waitTime' => $waitMinutes . ' min',
                'alert'    => $waitMinutes > 30,
            ];
        })
        ->values()
        ->toArray();

    return Inertia::render('CoordinadorDashboard', [
        'kpis' => [
            'enEspera'       => $turnosEnEsperaCount,
            'tiempoPromedio' => $tiempoPromedio ? round($tiempoPromedio / 60) : 0,
            'asesoresActivos'=> $asesoresActivos,
            'totalAsesores'  => $totalAsesores,
            'atencionesHoy'  => $atencionesHoyCount,
        ],
        'asesoresData'       => $asesoresData,
        'ciudadanosEnEspera' => $ciudadanosEnEspera,
    ]);
})->middleware(['auth', 'verified'])->name('dashboard.coordinador');

// ============================================================
//  API JSON para Coordinador (polling en tiempo real)
// ============================================================
Route::get('/api/coordinador/datos', function () {
    if (request()->user()->role !== 'coordinador') {
        abort(403);
    }

    $turnosEnEsperaCount = DB::table('turnos')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado', ['En Curso', 'Completado', 'No Asistió']);
        })
        ->whereNull('atenciones.id')
        ->whereDate('turnos.created_at', today())
        ->count();

    $tiempoPromedio = DB::table('atenciones')
        ->whereDate('created_at', today())
        ->where('estado', 'Completado')
        ->whereNotNull('hora_inicio')
        ->whereNotNull('hora_fin')
        ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as promedio')
        ->value('promedio');

    $totalAsesores  = DB::table('asesores')->count();
    $asesoresActivos = DB::table('atenciones')
        ->whereIn('estado', ['Llamando', 'En Curso'])
        ->distinct('asesor_id')
        ->count('asesor_id');

    $atencionesHoyCount = DB::table('atenciones')
        ->whereDate('created_at', today())
        ->whereIn('estado', ['Completado', 'No Asistió'])
        ->count();

    $asesoresData = DB::table('asesores')
        ->join('users', 'asesores.user_id', '=', 'users.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('asesores.id', '=', 'atenciones.asesor_id')
                 ->whereIn('atenciones.estado', ['Llamando', 'En Curso']);
        })
        ->leftJoin('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->select(
            'asesores.id',
            'users.name',
            'asesores.taquilla',
            'asesores.activo',
            'atenciones.estado as atencion_estado',
            'turnos.turno_numero',
            'atenciones.hora_inicio',
            'asesores.last_activity'
        )
        ->get()
        ->map(function($a) {
            $isOnline = $a->last_activity && Carbon::parse($a->last_activity)->diffInSeconds(now()) < 20;
            $status = !$isOnline ? 'OFFLINE' : (in_array($a->atencion_estado, ['Llamando', 'En Curso']) ? 'ATENDIENDO' : 'DISPONIBLE');
            $timeInSeconds = 0;
            if ($a->hora_inicio) {
                $timeInSeconds = Carbon::parse($a->hora_inicio)->diffInSeconds(now());
            }
            $m = str_pad(intdiv($timeInSeconds, 60), 2, '0', STR_PAD_LEFT);
            $s = str_pad($timeInSeconds % 60, 2, '0', STR_PAD_LEFT);
            return [
                'id'       => $a->id,
                'name'     => $a->name,
                'box'      => $a->taquilla ?? 'Sin asignar',
                'status'   => $status,
                'isOnline' => $isOnline,
                'activo'   => $a->activo ?? true,
                'turn'     => $a->turno_numero ?? '--',
                'time'     => (in_array($a->atencion_estado, ['Llamando', 'En Curso'])) ? "$m:$s" : '--',
                'timeInSeconds' => (int)$timeInSeconds,
                'avatar'   => collect(explode(' ', $a->name))->map(fn($w) => strtoupper(mb_substr($w, 0, 1)))->take(2)->implode(''),
            ];
        })
        ->values()
        ->toArray();

    $ciudadanosEnEspera = DB::table('turnos')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado', ['En Curso', 'Completado', 'No Asistió']);
        })
        ->whereNull('atenciones.id')
        ->whereDate('turnos.created_at', today())
        ->orderBy('turnos.id', 'asc')
        ->select('turnos.*')
        ->limit(10)
        ->get()
        ->map(function($t) {
            $waitMinutes = (int) Carbon::parse($t->created_at)->diffInMinutes(now());
            return [
                'id'       => $t->id,
                'turn'     => $t->turno_numero,
                'type'     => $t->tipo,
                'waitTime' => $waitMinutes . ' min',
                'alert'    => $waitMinutes > 30,
            ];
        })
        ->values()
        ->toArray();

    return response()->json([
        'kpis' => [
            'enEspera'       => $turnosEnEsperaCount,
            'tiempoPromedio' => $tiempoPromedio ? round($tiempoPromedio / 60) : 0,
            'asesoresActivos'=> $asesoresActivos,
            'totalAsesores'  => $totalAsesores,
            'atencionesHoy'  => $atencionesHoyCount,
        ],
        'asesoresData'       => $asesoresData,
        'ciudadanosEnEspera' => $ciudadanosEnEspera,
    ]);
})->middleware(['auth', 'verified']);

// ============================================================
//  Redirección inteligente por rol
// ============================================================
Route::get('/dashboard', function () {
    $user = request()->user();
    if ($user->role === 'coordinador') {
        return redirect()->route('dashboard.coordinador');
    }
    return redirect()->route('dashboard.asesor');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
