<?php

use App\Http\Controllers\ProfileController;
use App\Models\Asesor;
use App\Models\Atencion;
use App\Models\Turno;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Carbon\Carbon;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/seleccion', function () {
    return Inertia::render('SeleccionPoblacion');
});

Route::get('/registro', function () {
    return Inertia::render('Registro', [
        'tipo_poblacion' => request('tipo', 'General'),
    ]);
});

Route::post('/turno/generar', [\App\Http\Controllers\TurnoController::class, 'store'])->name('turno.generar');

// ============================================================
//  API JSON para la Pantalla de Turnos (polling)
// ============================================================
Route::get('/pantalla/turnos', function () {
    // Todos los turnos "En Curso" (puede haber varios asesores atendiendo a la vez)
    $enCurso = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('estados_atencion', 'atenciones.estado_id', '=', 'estados_atencion.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->where('estados_atencion.nombre', 'En Proceso')
        ->orderBy('atenciones.id', 'desc')
        ->select('turnos.id','turnos.turno_numero','tipos_turno.nombre as tipo','asesores.taquilla','estados_atencion.nombre as estado')
        ->first();

    // Historial reciente (últimos 4 completados/no asistió)
    $historial = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('estados_atencion', 'atenciones.estado_id', '=', 'estados_atencion.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->whereIn('estados_atencion.nombre', ['Finalizado', 'No Asistió'])
        
        ->orderBy('atenciones.id', 'desc')
        ->limit(4)
        ->select('turnos.id','turnos.turno_numero','tipos_turno.nombre as tipo','asesores.taquilla','estados_atencion.nombre as estado')
        ->get()
        ->map(fn($t) => [
            'id'      => $t->id,
            'turno'   => $t->turno_numero,
            'tipo'    => $t->tipo,
            'taquilla'=> $t->taquilla,
            'estado'  => $t->estado,
        ])
        ->values()
        ->toArray();

    return response()->json([
        'actual' => $enCurso ? [
            'id'      => $enCurso->id,
            'turno'   => $enCurso->turno_numero,
            'tipo'    => $enCurso->tipo,
            'taquilla'=> $enCurso->taquilla,
            'estado'  => $enCurso->estado,
        ] : null,
        'historial' => $historial,
    ]);
});

// ============================================================
//  Pantalla de Turnos (vista Inertia)
// ============================================================
Route::get('/pantalla', function () {
    $enCurso = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('estados_atencion', 'atenciones.estado_id', '=', 'estados_atencion.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->where('estados_atencion.nombre', 'En Proceso')
        ->orderBy('atenciones.id', 'desc')
        ->select('turnos.id','turnos.turno_numero','tipos_turno.nombre as tipo','asesores.taquilla','estados_atencion.nombre as estado')
        ->first();

    $historial = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('estados_atencion', 'atenciones.estado_id', '=', 'estados_atencion.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->whereIn('estados_atencion.nombre', ['Finalizado', 'No Asistió'])
        
        ->orderBy('atenciones.id', 'desc')
        ->limit(4)
        ->select('turnos.id','turnos.turno_numero','tipos_turno.nombre as tipo','asesores.taquilla','estados_atencion.nombre as estado')
        ->get()
        ->map(fn($t) => [
            'id'      => $t->id,
            'turno'   => $t->turno_numero,
            'tipo'    => $t->tipo,
            'taquilla'=> $t->taquilla,
            'estado'  => $t->estado,
        ])
        ->values()
        ->toArray();

    return Inertia::render('PantallaTurnos', [
        'turnoActualInicial' => $enCurso ? [
            'id'      => $enCurso->id,
            'turno'   => $enCurso->turno_numero,
            'tipo'    => $enCurso->tipo,
            'taquilla'=> $enCurso->taquilla,
            'estado'  => $enCurso->estado,
        ] : null,
        'historialInicial' => $historial,
    ]);
});

// ============================================================
//  Dashboard Asesor
// ============================================================
Route::get('/dashboard-asesor', function () {
    $user   = request()->user();
    $asesor = Asesor::where('user_id', $user->id)->first();

    // Si no tiene registro en asesores, crearlo con taquilla por defecto
    if (!$asesor) {
        $asesor = Asesor::create([
            'user_id'    => $user->id,
            'taquilla'   => 'Taquilla 01',
            'tipo_asesor'=> 'General',
        ]);
    }

    // Turnos en espera: sin atención activa "En Curso"
    $turnosEnEspera = DB::table('turnos')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado_id', [2, 3, 4]);
        })
        ->leftJoin('personas', 'turnos.persona_id', '=', 'personas.id')
        ->whereNull('atenciones.id')
        
        ->orderBy('turnos.id', 'asc')
        ->select('turnos.*', 'tipos_turno.nombre as tipo', 'personas.documento')
        ->get()
        ->map(fn($t) => [
            'id'       => $t->id,
            'turn'     => $t->turno_numero,
            'tipo'     => $t->tipo,
            'doc'      => $t->documento ?? '--',
            'timeWait' => Carbon::parse($t->hora_fecha)->diffForHumans(),
        ])
        ->values()
        ->toArray();

    // Atención activa del asesor
    $atencionActiva = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('estados_atencion', 'atenciones.estado_id', '=', 'estados_atencion.id')
        ->leftJoin('personas', 'turnos.persona_id', '=', 'personas.id')
        ->where('atenciones.asesor_id', $asesor->id)
        ->where('estados_atencion.nombre', 'En Proceso')
        ->select('atenciones.*', 'turnos.turno_numero', 'tipos_turno.nombre as tipo', 'personas.documento')
        ->first();

    // Historial del asesor (hoy)
    $historialAsesor = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('estados_atencion', 'atenciones.estado_id', '=', 'estados_atencion.id')
        ->leftJoin('personas', 'turnos.persona_id', '=', 'personas.id')
        ->where('atenciones.asesor_id', $asesor->id)
        ->whereIn('estados_atencion.nombre', ['Finalizado', 'No Asistió'])
        
        ->orderBy('atenciones.id', 'desc')
        ->select(
            'turnos.turno_numero',
            'tipos_turno.nombre as tipo',
            'personas.documento',
            'atenciones.observaciones',
            'estados_atencion.nombre as estado',
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
    $statsHoy = DB::table('atenciones')
        ->where('asesor_id', $asesor->id)
        
        ->whereIn('estado_id', [3, 4])
        ->selectRaw('COUNT(*) as total, AVG(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as promedio_seg')
        ->first();

    return Inertia::render('Dashboard', [
        'asesor'         => $asesor,
        'turnosEnEspera' => $turnosEnEspera,
        'atencionActiva' => $atencionActiva ? [
            'id'            => $atencionActiva->id,
            'turno_id'      => $atencionActiva->turno_id,
            'turn'          => $atencionActiva->turno_numero,
            'type'          => $atencionActiva->tipo,
            'doc'           => $atencionActiva->documento ?? '--',
            'hora_inicio'   => $atencionActiva->hora_inicio,
            'observaciones' => $atencionActiva->observaciones,
        ] : null,
        'historialAsesor' => $historialAsesor,
        'statsHoy'        => [
            'total'    => $statsHoy->total ?? 0,
            'promedio' => $statsHoy->promedio_seg ? round($statsHoy->promedio_seg / 60) : 0,
        ],
    ]);
})->middleware(['auth', 'verified'])->name('dashboard.asesor');

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
        
        'hora_inicio'=> now(),
        'estado_id'  => 2,
    ]);

    return back();
})->middleware(['auth', 'verified'])->name('asesor.llamar');

// ============================================================
//  Asesor: Finalizar Turno (+ auto-eliminación del turno)
// ============================================================
Route::post('/asesor/finalizar-turno', function () {
    $user   = request()->user();
    $asesor = Asesor::where('user_id', $user->id)->first();
    $estado = request('estado', 3);

    $atencion = Atencion::where('asesor_id', $asesor->id)
        ->where('estado_id', 2)
        ->first();

    if ($atencion) {
        $atencion->update([
            'estado_id'    => $estado == 'Completado' ? 3 : ($estado == 'No Asistió' ? 4 : 3),
            'hora_fin'      => now(),
            'observaciones' => request('observaciones'),
        ]);

        // AUTO-ELIMINAR: Borrar el turno y sus registros asociados
        // (La atencion se auto-borra por cascadeOnDelete en la migración)
        $turno = Turno::find($atencion->turno_id);
        if ($turno) {
            // Borrar el solicitante asociado (se auto-borra la persona por cascade si no la necesitas)
            // Nota: NO borramos la persona, solo el solicitante y turno para mantener historial de personas
            $turno->delete(); // Esto borra el turno + atenciones (cascade)
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
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado_id', [2, 3, 4]);
        })
        ->whereNull('atenciones.id')
        
        ->count();

    $tiempoPromedio = DB::table('atenciones')
        
        ->where('estado_id', 3)
        ->whereNotNull('hora_inicio')
        ->whereNotNull('hora_fin')
        ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as promedio')
        ->value('promedio');

    $totalAsesores  = DB::table('asesores')->count();
    $asesoresActivos = DB::table('atenciones')
        ->where('estado_id', 2)
        ->distinct('asesor_id')
        ->count('asesor_id');

    $atencionesHoyCount = DB::table('atenciones')
        
        ->whereIn('estado_id', [3, 4])
        ->count();

    // Asesores con su estado actual
    $asesoresData = DB::table('asesores')
        ->join('users', 'asesores.user_id', '=', 'users.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('asesores.id', '=', 'atenciones.asesor_id')
                 ->where('atenciones.estado_id', '=', 2);
        })
        ->leftJoin('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->select(
            'asesores.id',
            'users.name',
            'asesores.taquilla',
            'estados_atencion.nombre as atencion_estado',
            'turnos.turno_numero',
            'atenciones.hora_inicio'
        )
        ->get()
        ->map(function($a) {
            $status = $a->atencion_estado === 'En Curso' ? 'ATENDIENDO' : 'DISPONIBLE';
            $timeInSeconds = 0;
            if ($a->hora_inicio) {
                $timeInSeconds = Carbon::parse($a->hora_inicio)->diffInSeconds(now());
            }
            $m = str_pad(intdiv($timeInSeconds, 60), 2, '0', STR_PAD_LEFT);
            $s = str_pad($timeInSeconds % 60, 2, '0', STR_PAD_LEFT);
            return [
                'id'     => $a->id,
                'name'   => $a->name,
                'box'    => $a->taquilla ?? 'Sin asignar',
                'status' => $status,
                'turn'   => $a->turno_numero ?? '--',
                'time'   => $status === 'ATENDIENDO' ? "$m:$s" : '--',
                'timeInSeconds' => (int)$timeInSeconds,
                'avatar' => collect(explode(' ', $a->name))->map(fn($w) => strtoupper(mb_substr($w, 0, 1)))->take(2)->implode(''),
            ];
        })
        ->values()
        ->toArray();

    // Ciudadanos en espera con detalle
    $ciudadanosEnEspera = DB::table('turnos')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado_id', [2, 3, 4]);
        })
        ->whereNull('atenciones.id')
        
        ->orderBy('turnos.id', 'asc')
        ->select('turnos.*', 'tipos_turno.nombre as tipo')
        ->limit(10)
        ->get()
        ->map(function($t) {
            $waitMinutes = Carbon::parse($t->hora_fecha)->diffInMinutes(now());
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
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado_id', [2, 3, 4]);
        })
        ->whereNull('atenciones.id')
        
        ->count();

    $tiempoPromedio = DB::table('atenciones')
        
        ->where('estado_id', 3)
        ->whereNotNull('hora_inicio')
        ->whereNotNull('hora_fin')
        ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as promedio')
        ->value('promedio');

    $totalAsesores  = DB::table('asesores')->count();
    $asesoresActivos = DB::table('atenciones')
        ->where('estado_id', 2)
        ->distinct('asesor_id')
        ->count('asesor_id');

    $atencionesHoyCount = DB::table('atenciones')
        
        ->whereIn('estado_id', [3, 4])
        ->count();

    $asesoresData = DB::table('asesores')
        ->join('users', 'asesores.user_id', '=', 'users.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('asesores.id', '=', 'atenciones.asesor_id')
                 ->where('atenciones.estado_id', '=', 2);
        })
        ->leftJoin('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->select(
            'asesores.id',
            'users.name',
            'asesores.taquilla',
            'estados_atencion.nombre as atencion_estado',
            'turnos.turno_numero',
            'atenciones.hora_inicio'
        )
        ->get()
        ->map(function($a) {
            $status = $a->atencion_estado === 'En Curso' ? 'ATENDIENDO' : 'DISPONIBLE';
            $timeInSeconds = 0;
            if ($a->hora_inicio) {
                $timeInSeconds = Carbon::parse($a->hora_inicio)->diffInSeconds(now());
            }
            $m = str_pad(intdiv($timeInSeconds, 60), 2, '0', STR_PAD_LEFT);
            $s = str_pad($timeInSeconds % 60, 2, '0', STR_PAD_LEFT);
            return [
                'id'     => $a->id,
                'name'   => $a->name,
                'box'    => $a->taquilla ?? 'Sin asignar',
                'status' => $status,
                'turn'   => $a->turno_numero ?? '--',
                'time'   => $status === 'ATENDIENDO' ? "$m:$s" : '--',
                'timeInSeconds' => (int)$timeInSeconds,
                'avatar' => collect(explode(' ', $a->name))->map(fn($w) => strtoupper(mb_substr($w, 0, 1)))->take(2)->implode(''),
            ];
        })
        ->values()
        ->toArray();

    $ciudadanosEnEspera = DB::table('turnos')
        ->leftJoin('tipos_turno', 'turnos.tipo_turno_id', '=', 'tipos_turno.id')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado_id', [2, 3, 4]);
        })
        ->whereNull('atenciones.id')
        
        ->orderBy('turnos.id', 'asc')
        ->select('turnos.*', 'tipos_turno.nombre as tipo')
        ->limit(10)
        ->get()
        ->map(function($t) {
            $waitMinutes = Carbon::parse($t->hora_fecha)->diffInMinutes(now());
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
    if ($user->role_id === 2) {
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
