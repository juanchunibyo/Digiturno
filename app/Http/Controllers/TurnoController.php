<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TurnoController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'tipo_documento' => 'required|string|max:10',
            'documento'      => 'required|string|max:20',
            'telefono'       => 'nullable|string|max:20',
            'tipo'           => 'required|string|max:45',
        ]);

        // 1. Persona: buscar o crear
        $persona = DB::table('personas')->where('documento', $request->documento)->first();

        if (!$persona) {
            $personaId = DB::table('personas')->insertGetId([
                'documento'      => $request->documento,
                'tipo_documento' => $request->tipo_documento,
                'nombres'        => 'Sin Nombre',
                'apellidos'      => '',
                'telefono'       => $request->telefono,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        } else {
            $personaId = $persona->id;
        }

        // Usamos transacción para evitar que dos personas obtengan el mismo número al mismo tiempo
        $numero = DB::transaction(function () use ($request, $personaId) {
            // 1. Solicitante
            $solicitanteId = DB::table('solicitantes')->insertGetId([
                'persona_id'       => $personaId,
                'tipo_solicitante' => $request->tipo,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);

            // 2. Generar número único
            $t = strtolower($request->tipo);
            $prefijo = 'G';
            if (str_contains($t, 'víctima')) $prefijo = 'V';
            elseif (str_contains($t, 'priorit')) $prefijo = 'P';
            elseif (str_contains($t, 'empresa')) $prefijo = 'E';
            elseif (str_contains($t, 'interna')) $prefijo = 'I';
            
            // Bloqueamos la tabla para que nadie más cuente mientras generamos el número
            $count = DB::table('turnos')
                ->whereDate('created_at', today())
                ->where('tipo', $request->tipo)
                ->lockForUpdate()
                ->count() + 1;
                
            $numero = $prefijo . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

            // 3. Crear Turno
            $turnoId = DB::table('turnos')->insertGetId([
                'solicitante_id' => $solicitanteId,
                'turno_numero'   => $numero,
                'tipo'           => $request->tipo,
                'hora_fecha'     => now(),
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            // 4. ASIGNACIÓN AUTOMÁTICA
            $asesoresDisponibles = DB::table('asesores')
                ->leftJoin('atenciones', function($join) {
                    $join->on('asesores.id', '=', 'atenciones.asesor_id')
                         ->whereIn('atenciones.estado', ['Llamando', 'En Curso']);
                })
                ->whereNull('atenciones.id')
                ->whereRaw('TIMESTAMPDIFF(SECOND, asesores.last_activity, NOW()) < 20')
                ->select('asesores.id', 'asesores.tipo_asesor')
                ->get();

            $asesorFinalId = null;

            if ($request->tipo === 'Víctimas' || $request->tipo === 'Víctima') {
                // Para turnos de Víctimas: Solo especialistas
                $asesorFinalId = $asesoresDisponibles->where('tipo_asesor', 'Víctimas')->first()?->id;
            } else {
                // Para turnos Generales/Otros:
                // 1. Preferir asesores que NO sean de Víctimas
                $asesorFinalId = $asesoresDisponibles->where('tipo_asesor', '!=', 'Víctimas')->first()?->id;

                // 2. Si no hay generales libres, ver si un especialista puede (solo si no tiene cola de víctimas)
                if (!$asesorFinalId) {
                    $hayVictimasEnEspera = DB::table('turnos')
                        ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
                        ->whereNull('atenciones.id')
                        ->where('turnos.tipo', 'Víctimas')
                        ->whereDate('turnos.created_at', today())
                        ->exists();

                    if (!$hayVictimasEnEspera) {
                        $asesorFinalId = $asesoresDisponibles->where('tipo_asesor', 'Víctimas')->first()?->id;
                    }
                }
            }

            if ($asesorFinalId) {
                DB::table('atenciones')->insert([
                    'turno_id'    => $turnoId,
                    'asesor_id'   => $asesorFinalId,
                    'tipo'        => $request->tipo,
                    'hora_inicio' => now(),
                    'estado'      => 'Llamando',
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }

            return $numero;
        });

        return response()->json([
            'turno_numero' => $numero,
            'tipo'         => $request->tipo,
            'hora'         => now()->format('h:i A'),
            'fecha'        => now()->format('d/m/Y'),
            'documento'    => $request->documento,
        ]);
    }
}
