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

        // 2. Solicitante
        $solicitanteId = DB::table('solicitantes')->insertGetId([
            'persona_id'       => $personaId,
            'tipo_solicitante' => $request->tipo,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // 3. Número de turno: prefijo + correlativo del día
        $prefijos = [
            'General'     => 'N',
            'Prioritaria' => 'P',
            'Víctimas'    => 'V',
            'Empresa'     => 'E',
        ];
        $prefijo = $prefijos[$request->tipo] ?? 'N';
        $count   = DB::table('turnos')->whereDate('created_at', today())->count() + 1;
        $numero  = $prefijo . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        // 4. Turno
        DB::table('turnos')->insert([
            'solicitante_id' => $solicitanteId,
            'turno_numero'   => $numero,
            'tipo'           => $request->tipo,
            'hora_fecha'     => now(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return Inertia::render('TurnoGenerado', [
            'turno_numero' => $numero,
            'tipo'         => $request->tipo,
            'hora'         => now()->format('h:i A'),
            'fecha'        => now()->format('d/m/Y'),
            'documento'    => $request->documento,
        ]);
    }
}
