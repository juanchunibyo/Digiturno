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
                // Omitimos nombres y apellidos porque la BD no los tiene
                'telefono'       => $request->telefono,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        } else {
            $personaId = $persona->id;
        }

        // 2. Número de turno: prefijo + correlativo del día
        $prefijos = [
            'General'     => 'N',
            'Prioritaria' => 'P',
            'Víctima'    => 'V',
            'Víctimas'    => 'V',
            'Empresa'     => 'E',
        ];
        $prefijo = $prefijos[$request->tipo] ?? 'N';
        $count   = DB::table('turnos')->whereDate('created_at', today())->count() + 1;
        $numero  = $prefijo . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);

        // 3. Buscar el ID del tipo de turno en la base de datos
        $tipoObj = DB::table('tipos_turno')->where('nombre', 'like', '%' . $request->tipo . '%')->first();
        $tipoId = $tipoObj ? $tipoObj->id : 3; // 3 es General por defecto

        // 4. Guardar el Turno
        DB::table('turnos')->insert([
            'persona_id'     => $personaId,
            'turno_numero'   => $numero,
            'tipo_turno_id'  => $tipoId,
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
