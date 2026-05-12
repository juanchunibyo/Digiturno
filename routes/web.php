<?php

use App\Http\Controllers\ProfileController;
use App\Models\Asesor;
use App\Models\Atencion;
use App\Models\Turno;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Carbon\Carbon;

if (!function_exists('getAsesoresDataOptimized')) {
    function getAsesoresDataOptimized() {
        $today = today();
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        // Atenciones de HOY (para el dashboard y historial inmediato)
        $atencionesHoy = DB::table('atenciones')
            ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
            ->whereDate('atenciones.created_at', $today)
            ->orderBy('atenciones.id', 'desc')
            ->select('atenciones.*', 'turnos.turno_numero', 'turnos.tipo as turno_tipo', 'turnos.hora_fecha')
            ->get()
            ->groupBy('asesor_id');

        // Atenciones de la SEMANA (para la matriz de reportes)
        $atencionesSemana = DB::table('atenciones')
            ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
            ->whereBetween('atenciones.created_at', [$startOfWeek, $endOfWeek])
            ->where('atenciones.estado', 'Completado')
            ->select('atenciones.*', 'turnos.hora_fecha')
            ->get()
            ->groupBy('asesor_id');

        // Descansos (Todos los de hoy para el historial)
        $todosDescansosHoy = DB::table('descansos')
            ->whereDate('inicio', $today)
            ->get()
            ->groupBy('asesor_id');

        // Descansos activos
        $descansosActivos = DB::table('descansos')
            ->whereNull('fin')
            ->get()
            ->keyBy('asesor_id');

        // Alertas de hoy
        $alertasHoy = DB::table('alertas_asesores')
            ->whereDate('created_at', $today)
            ->get()
            ->groupBy('asesor_id');

        return DB::table('asesores')
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
                'asesores.tipo_asesor',
                'atenciones.estado as atencion_estado',
                'turnos.turno_numero',
                'atenciones.hora_inicio',
                'asesores.last_activity',
                'asesores.jornada_asignada'
            )
            ->get()
            ->map(function($a) use ($atencionesHoy, $atencionesSemana, $descansosActivos, $todosDescansosHoy, $alertasHoy) {
                $isOnline = $a->last_activity && Carbon::parse($a->last_activity)->diffInSeconds(now()) < 60;
                
                if (!$isOnline) {
                    $status = 'OFFLINE';
                } elseif ($descansosActivos->has($a->id)) {
                    $status = 'DESCANSO';
                } elseif ($a->atencion_estado === 'Llamando') {
                    $status = 'LLAMANDO';
                } elseif ($a->atencion_estado === 'En Curso') {
                    $status = 'ATENDIENDO';
                } else {
                    $status = 'DISPONIBLE';
                }
                
                // Cálculo de tiempo (Atención o Descanso)
                $startTime = null;
                if ($status === 'DESCANSO' && $descansosActivos->has($a->id)) {
                    $activeDescanso = $descansosActivos[$a->id];
                    $startTime = $activeDescanso->inicio;

                    // Lógica de Alerta Automática de Descanso (> 5 min)
                    $diffMin = Carbon::parse($startTime)->diffInMinutes(now());
                    if ($diffMin >= 5) {
                        $yaNotificado = DB::table('alertas_asesores')
                            ->where('asesor_id', $a->id)
                            ->where('tipo', 'Demora Descanso')
                            ->where('created_at', '>=', $activeDescanso->inicio)
                            ->exists();
                        if (!$yaNotificado) {
                            DB::table('alertas_asesores')->insert([
                                'asesor_id' => $a->id,
                                'tipo' => 'Demora Descanso',
                                'duracion_minutos' => $diffMin,
                                'estado_asesor' => 'DESCANSO',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }
                    }
                } elseif ($a->atencion_estado === 'En Curso') {
                    $startTime = $a->hora_inicio;
                }

                $timeInSeconds = $startTime ? Carbon::parse($startTime)->diffInSeconds(now()) : 0;
                $m = str_pad(intdiv($timeInSeconds, 60), 2, '0', STR_PAD_LEFT);
                $s = str_pad($timeInSeconds % 60, 2, '0', STR_PAD_LEFT);

                $misAtencionesHoy = $atencionesHoy->get($a->id, collect());
                $misAtencionesSemana = $atencionesSemana->get($a->id, collect());

                // Cálculo de tiempos para Reportes
                $totalWaitSeconds = $misAtencionesSemana->map(function($at) {
                    if ($at->hora_inicio && $at->hora_fecha) {
                        return Carbon::parse($at->hora_fecha)->diffInSeconds(Carbon::parse($at->hora_inicio));
                    }
                    return 0;
                })->sum();

                $totalAtenSeconds = $misAtencionesSemana->whereNotNull('hora_inicio')->whereNotNull('hora_fin')->map(function($at) {
                    return Carbon::parse($at->hora_inicio)->diffInSeconds(Carbon::parse($at->hora_fin));
                })->sum();

                $countSemana = $misAtencionesSemana->count();
                $avgWait = $countSemana > 0 ? round($totalWaitSeconds / $countSemana / 60) : 0;
                $avgAten = $countSemana > 0 ? round($totalAtenSeconds / $countSemana / 60) : 0;

                // Cálculo de desglose semanal (LUN-SÁB)
                $weeklyBreakdown = [0,0,0,0,0,0]; // L, M, X, J, V, S
                foreach ($misAtencionesSemana as $at) {
                    $dayIndex = Carbon::parse($at->created_at)->dayOfWeekIso - 1; // 1 (Lun) a 7 (Dom)
                    if ($dayIndex >= 0 && $dayIndex < 6) {
                        $weeklyBreakdown[$dayIndex]++;
                    }
                }

                return [
                    'id'       => $a->id,
                    'name'     => $a->name,
                    'box'      => $a->taquilla ?? 'Sin asignar',
                    'jornada'  => $a->jornada_asignada,
                    'status'   => $status,
                    'isOnline' => $isOnline,
                    'activo'   => $a->activo ?? true,
                    'tipo_asesor' => $a->tipo_asesor,
                    'turn'     => $a->turno_numero ?? '--',
                    'time'     => (in_array($a->atencion_estado, ['Llamando', 'En Curso']) || $status === 'DESCANSO') ? "$m:$s" : '--:--',
                    'break_time' => ($status === 'DESCANSO') ? "$m:$s" : '--:--',
                    'start_time' => $startTime ? Carbon::parse($startTime)->toIso8601String() : null,
                    'atenciones_count' => $misAtencionesHoy->where('estado', 'Completado')->count(),
                    'turnos_atendidos' => $misAtencionesHoy->where('estado', 'Completado')->count(),
                    'promedio_atencion' => $avgAten,
                    'promedio_espera'   => $avgWait,
                    'total_espera'      => round($totalWaitSeconds / 60) . 'm',
                    'total_atencion'    => round($totalAtenSeconds / 60) . 'm',
                    'weekly_breakdown'  => $weeklyBreakdown,
                    'atenciones_historial' => $misAtencionesHoy->take(50)->map(fn($at) => [
                        'turn'   => $at->turno_numero,
                        'type'   => $at->turno_tipo,
                        'status' => strtoupper($at->estado),
                        'inicio' => $at->hora_inicio ? Carbon::parse($at->hora_inicio)->format('H:i') : '--',
                        'dur'    => ($at->hora_inicio && $at->hora_fin) 
                                    ? Carbon::parse($at->hora_inicio)->diffInSeconds(Carbon::parse($at->hora_fin))
                                    : 0,
                        'espera' => ($at->hora_inicio && $at->hora_fecha)
                                    ? Carbon::parse($at->hora_fecha)->diffInSeconds(Carbon::parse($at->hora_inicio))
                                    : 0
                    ]),
                    'breaks_history' => $todosDescansosHoy->get($a->id, collect())->map(function($b) {
                        $durS = $b->fin ? Carbon::parse($b->inicio)->diffInSeconds(Carbon::parse($b->fin)) : 0;
                        $m = str_pad(intdiv($durS, 60), 2, '0', STR_PAD_LEFT);
                        $s = str_pad($durS % 60, 2, '0', STR_PAD_LEFT);
                        return [
                            'inicio' => Carbon::parse($b->inicio)->format('H:i:s'),
                            'fin'    => $b->fin ? Carbon::parse($b->fin)->format('H:i:s') : '...',
                            'duracion' => $b->fin ? Carbon::parse($b->inicio)->diffInMinutes(Carbon::parse($b->fin)) : '...',
                            'duracion_format' => $b->fin ? "$m:$s" : '...'
                        ];
                    }),
                    'alertas_history' => $alertasHoy->get($a->id, collect())->map(fn($al) => [
                        'tipo' => $al->tipo,
                        'duracion' => $al->duracion_minutos
                    ]),
                    'alertas_count' => $alertasHoy->get($a->id, collect())->count(),
                    'avatar'   => collect(explode(' ', $a->name))->map(fn($w) => strtoupper(mb_substr($w, 0, 1)))->take(2)->implode(''),
                ];
            })
            ->values()
            ->toArray();
    }
}

/**
 * Lógica unificada para obtener el siguiente turno de un asesor.
 * Implementa la regla 2x1: Atender a 2 prioritarios y después atender a uno general/empresa/etc.
 */
if (!function_exists('getSiguienteTurnoParaAsesor')) {
    function getSiguienteTurnoParaAsesor($asesor) {
        $siguienteTurno = null;

        if ($asesor->tipo_asesor === 'Víctimas') {
            // Asesor Víctimas: Primero busca Víctimas
            $siguienteTurno = DB::table('turnos')
                ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
                ->whereNull('atenciones.id')
                ->where('turnos.tipo', 'Víctimas')
                ->whereDate('turnos.created_at', today())
                ->orderBy('turnos.id', 'asc')
                ->select('turnos.*')
                ->first();
                
            if (!$siguienteTurno) {
                // Y el resto a él (busca cualquier otro que NO sea víctimas)
                $siguienteTurno = DB::table('turnos')
                    ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
                    ->whereNull('atenciones.id')
                    ->where('turnos.tipo', '!=', 'Víctimas')
                    ->whereDate('turnos.created_at', today())
                    ->orderBy('turnos.id', 'asc')
                    ->select('turnos.*')
                    ->first();
            }
            return $siguienteTurno;
        }

        // --- LÓGICA 2x1 PARA ASESORES GENERALES/ESPECIALIZADOS ---
        
        // 1. Obtener historial reciente para decidir si forzamos General
        $ultimas = DB::table('atenciones')
            ->where('tipo', '!=', 'Víctimas')
            ->whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->take(2)
            ->pluck('tipo');

        $prioritariosContados = 0;
        foreach ($ultimas as $tipo) {
            if (stripos($tipo, 'priorit') !== false) {
                $prioritariosContados++;
            }
        }

        // Si los últimos 2 fueron prioritarios, forzamos uno que NO sea prioritario
        $forzarGeneral = ($prioritariosContados >= 2);

        // 2. Consulta base para turnos en espera
        $baseQuery = DB::table('turnos')
            ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
            ->whereNull('atenciones.id')
            ->where('turnos.tipo', '!=', 'Víctimas')
            ->whereDate('turnos.created_at', today())
            ->orderBy('turnos.id', 'asc')
            ->select('turnos.*');

        // 3. Aplicar filtros según la regla
        if ($forzarGeneral) {
            // Intentar buscar uno que NO sea prioritario
            $siguienteTurno = (clone $baseQuery)->where('turnos.tipo', 'NOT LIKE', '%Priorit%')->first();
            
            // Si forzamos general pero NO HAY generales, pues ni modo, seguimos con el que toque
            if (!$siguienteTurno) {
                $siguienteTurno = $baseQuery->first();
            }
        } else {
            // No estamos forzando general -> PREFERENCIA ABSOLUTA A PRIORITARIOS
            $siguienteTurno = (clone $baseQuery)->where('turnos.tipo', 'LIKE', '%Priorit%')->first();
            
            // Si no hay prioritarios en espera, seguimos con el siguiente disponible (probablemente general)
            if (!$siguienteTurno) {
                // Aquí aplicamos la especialidad del asesor si no es General
                if ($asesor->tipo_asesor && $asesor->tipo_asesor !== 'General') {
                    $especializado = (clone $baseQuery)->where('turnos.tipo', $asesor->tipo_asesor)->first();
                    if ($especializado) {
                        $siguienteTurno = $especializado;
                    }
                }
                
                // Si aún no tenemos turno, tomamos el primero de la cola
                if (!$siguienteTurno) {
                    $siguienteTurno = $baseQuery->first();
                }
            }
        }

        return $siguienteTurno;
    }
}

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

// Heartbeat silencioso del asesor
Route::post('/api/asesor/heartbeat', function () {
    $user = request()->user();
    $asesor = Asesor::where('user_id', $user->id)->first();
    if ($asesor) {
        $asesor->update(['last_activity' => now()]);
    }
    return response()->json(['status' => 'ok']);
})->middleware(['auth', 'verified'])->name('asesor.heartbeat');

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

    // Turnos que se están LLAMANDO en este momento (para que la pantalla los anuncie)
    $llamando = DB::table('atenciones')
        ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
        ->join('asesores', 'atenciones.asesor_id', '=', 'asesores.id')
        ->where('atenciones.estado', 'Llamando')
        ->whereDate('atenciones.created_at', today())
        ->select('turnos.id','turnos.turno_numero','turnos.tipo','asesores.taquilla','atenciones.estado','atenciones.updated_at')
        ->get();

    return response()->json([
        'actual' => $enCurso ? [
            'id'      => $enCurso->id,
            'turno'   => $enCurso->turno_numero,
            'tipo'    => $enCurso->tipo,
            'taquilla'=> $enCurso->taquilla,
            'estado'  => $enCurso->estado,
            'updated_at' => $enCurso->updated_at,
        ] : null,
        'llamando' => $llamando,
        'enEspera' => $enEspera,
        'historial' => $historial,
    ]);
});

// Agregamos ruta para el check-in del asesor
Route::post('/asesor/checkin', function (Illuminate\Http\Request $request) {
    DB::table('atenciones')
        ->where('id', $request->atencion_id)
        ->update([
            'estado' => 'En Curso', 
            'hora_inicio' => now(), // Reiniciamos el reloj para que cuente solo la consulta
            'updated_at' => now()
        ]);
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

    if (!$atencionActivaRecord) {
        $siguiente = getSiguienteTurnoParaAsesor($asesor);

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
                'inicio'   => $row->hora_inicio ? Carbon::parse($row->hora_inicio)->format('H:i:s') : '--',
                'fin'      => $row->hora_fin ? Carbon::parse($row->hora_fin)->format('H:i:s') : '--',
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
        ->where('estado', 'Completado')
        ->selectRaw('COUNT(*) as total, AVG(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as promedio_seg')
        ->first();

    // Verificar si hay un descanso activo
    $descansoActivo = DB::table('descansos')
        ->where('asesor_id', $asesor->id)
        ->whereNull('fin')
        ->first();

    // Estadísticas de descanso hoy
    $descansosHoy = DB::table('descansos')
        ->where('asesor_id', $asesor->id)
        ->whereDate('inicio', today())
        ->get();

    $maxDescanso = 0;
    foreach ($descansosHoy as $d) {
        if ($d->fin) {
            $dur = intval(Carbon::parse($d->inicio)->diffInMinutes(Carbon::parse($d->fin)));
            if ($dur > $maxDescanso) $maxDescanso = $dur;
        }
    }

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
        'descansoActivo'  => $descansoActivo,
        'statsHoy'        => [
            'total'    => $statsHoyData->total ?? 0,
            'promedio' => $statsHoyData->promedio_seg ? round($statsHoyData->promedio_seg / 60) : 0,
            'maxDescanso' => $maxDescanso,
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

Route::post('/coordinador/asignar-puesto', function () {
    if (request()->user()->role !== 'coordinador') abort(403);
    
    $modulo = request('modulo');
    $jornada = request('jornada');
    $asesorId = request('asesor_id');

    // Verificar si el módulo ya está ocupado por OTRO asesor en la MISMA jornada
    $ocupado = Asesor::where('taquilla', $modulo)
        ->where('jornada_asignada', $jornada)
        ->where('id', '!=', $asesorId)
        ->exists();

    if ($ocupado) {
        return back()->with('error', "El $modulo ya está ocupado en la jornada $jornada por otro asesor.");
    }

    $asesor = Asesor::find($asesorId);
    if ($asesor) {
        $asesor->update([
            'taquilla' => $modulo,
            'jornada_asignada' => $jornada
        ]);
        return back()->with('success', "¡$modulo asignado con éxito!");
    }
    return back();
})->middleware(['auth', 'verified'])->name('coordinador.asignar-puesto');

Route::post('/coordinador/desasignar-puesto', function () {
    if (request()->user()->role !== 'coordinador') abort(403);
    $asesor = Asesor::find(request('asesor_id'));
    if ($asesor) {
        $asesor->update([
            'taquilla' => null,
            'jornada_asignada' => 'MAÑANA' // Estado por defecto al liberar
        ]);
    }
    return back();
})->middleware(['auth', 'verified'])->name('coordinador.desasignar-puesto');

Route::post('/coordinador/toggle-victimas', function () {
    if (request()->user()->role !== 'coordinador') abort(403);
    $asesor = Asesor::find(request('asesor_id'));
    if ($asesor) {
        $nuevoTipo = $asesor->tipo_asesor === 'Víctimas' ? 'General' : 'Víctimas';
        $asesor->update(['tipo_asesor' => $nuevoTipo]);
    }
    return back();
})->middleware(['auth', 'verified'])->name('coordinador.toggle-victimas');

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
        'estado'     => 'Llamando',
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
        ->whereIn('estado', ['Llamando', 'En Curso'])
        ->first();

    if ($atencion) {
        $atencion->update([
            'estado'        => $estado,
            'hora_fin'      => now(),
            'observaciones' => request('observaciones'),
        ]);

        // Si NO solicitó descanso, asignamos el siguiente automáticamente
        if (!request('tomar_descanso')) {
            $siguienteTurno = getSiguienteTurnoParaAsesor($asesor);

            if ($siguienteTurno) {
                Atencion::create([
                    'turno_id'    => $siguienteTurno->id,
                    'asesor_id'   => $asesor->id,
                    'tipo'        => $siguienteTurno->tipo,
                    'hora_inicio' => now(),
                    'estado'      => 'Llamando',
                ]);
            }
        } else {
            // Registrar inicio de descanso
            DB::table('descansos')->insert([
                'asesor_id'  => $asesor->id,
                'inicio'     => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    return back();
})->middleware(['auth', 'verified'])->name('asesor.finalizar');

Route::post('/asesor/finalizar-descanso', function () {
    $user   = request()->user();
    $asesor = Asesor::where('user_id', $user->id)->first();
    
    DB::table('descansos')
        ->where('asesor_id', $asesor->id)
        ->whereNull('fin')
        ->update([
            'fin' => now(),
            'updated_at' => now()
        ]);

    return back();
})->middleware(['auth', 'verified'])->name('asesor.finalizar-descanso');

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
        ->where('estado', 'Completado')
        ->count();

    // Asesores con su estado actual (Optimizado)
    $asesoresData = getAsesoresDataOptimized();

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

    $isHistorial = false;
    $atencionesCount = 0;
    $promedio = 0;
    $porTipo = [];

    if (request('periodo')) {
        $periodo = request('periodo');
        $isHistorial = ($periodo === 'mensual' || $periodo === 'semanal');
        
        $query = DB::table('atenciones')->where('estado', 'Completado');
        if ($isHistorial) {
            $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
        } else {
            $query->whereDate('created_at', today());
        }

        if (request('asesor_id')) {
            $query->where('asesor_id', request('asesor_id'));
        }

        $atencionesCount = (clone $query)->count();
        $promedio = (clone $query)
            ->whereNotNull('hora_inicio')
            ->whereNotNull('hora_fin')
            ->selectRaw('AVG(TIMESTAMPDIFF(SECOND, hora_inicio, hora_fin)) as promedio')
            ->value('promedio');

        $porTipo = (clone $query)
            ->select('tipo', DB::raw('count(*) as total'))
            ->groupBy('tipo')
            ->get();
    }

    $turnosEnEsperaCount = DB::table('turnos')
        ->leftJoin('atenciones', function($join) {
            $join->on('turnos.id', '=', 'atenciones.turno_id')
                 ->whereIn('atenciones.estado', ['En Curso', 'Completado', 'No Asistió']);
        })
        ->whereNull('atenciones.id')
        ->whereDate('turnos.created_at', today())
        ->count();

    $tiempoPromedioReal = DB::table('atenciones')
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
        ->where('estado', 'Completado')
        ->count();

    return response()->json([
        'kpis' => [
            'enEspera'       => $turnosEnEsperaCount,
            'tiempoPromedio' => $isHistorial ? ($promedio ? round($promedio / 60) : 0) : ($tiempoPromedioReal ? round($tiempoPromedioReal / 60) : 0),
            'asesoresActivos'=> $asesoresActivos,
            'totalAsesores'  => $totalAsesores,
            'atencionesHoy'  => $isHistorial ? $atencionesCount : $atencionesHoyCount,
        ],
        'asesoresData'       => getAsesoresDataOptimized(),
        'ciudadanosEnEspera' => DB::table('turnos')
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
            })->values()->toArray(),
        'isHistorial' => $isHistorial,
        'porTipo'     => $porTipo
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
