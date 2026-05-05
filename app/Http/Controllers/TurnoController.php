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
            $prefijos = [
                'General'     => 'G',
                'Prioritaria' => 'P',
                'Víctimas'    => 'V',
                'Empresa'     => 'E',
            ];
            $prefijo = $prefijos[$request->tipo] ?? 'G';
            
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

            // 4. ASIGNACIÓN AUTOMÁTICA (El asesor nunca llama)
            // Buscamos un asesor disponible que sea compatible con el tipo de turno y que esté ONLINE (actividad reciente < 20s)
            $queryAsesor = DB::table('asesores')
                ->leftJoin('atenciones', function($join) {
                    $join->on('asesores.id', '=', 'atenciones.asesor_id')
                         ->whereIn('atenciones.estado', ['Llamando', 'En Curso']);
                })
                ->whereNull('atenciones.id')
                ->whereRaw('TIMESTAMPDIFF(SECOND, asesores.last_activity, NOW()) < 20');

            // Si el turno es especializado (ej: Víctimas), buscamos un asesor de ese tipo
            if ($request->tipo === 'Víctimas' || $request->tipo === 'Víctima') {
                $queryAsesor->where('asesores.tipo_asesor', 'Víctimas');
            } else {
                // Para los demás turnos (General, Empresa, Prioritaria), TODOS los asesores (incluso los de Víctimas)
                // pueden atenderlos. "todas las victimas y el resto a el y los demas todas pero sin victimas"
            }

            $asesorDisponible = $queryAsesor->select('asesores.id')->first();

            if ($asesorDisponible) {
                DB::table('atenciones')->insert([
                    'turno_id'    => $turnoId,
                    'asesor_id'   => $asesorDisponible->id,
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
