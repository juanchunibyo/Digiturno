<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class LimpiarTurnosViejos extends Command
{
    protected $signature   = 'turnos:limpiar';
    protected $description = 'Elimina los turnos creados hace más de 24 horas que no fueron atendidos o ya finalizaron';

    public function handle(): void
    {
        $limite = now()->subHours(24);

        // Turnos sin atención (nunca fueron llamados) con más de 24h
        $sinAtencion = DB::table('turnos')
            ->leftJoin('atenciones', 'turnos.id', '=', 'atenciones.turno_id')
            ->whereNull('atenciones.id')
            ->where('turnos.created_at', '<', $limite)
            ->pluck('turnos.id');

        if ($sinAtencion->isNotEmpty()) {
            DB::table('turnos')->whereIn('id', $sinAtencion)->delete();
            $this->info("Eliminados {$sinAtencion->count()} turnos sin atención.");
        }

        // Turnos con atención ya completada/no asistió con más de 24h
        $completados = DB::table('atenciones')
            ->join('turnos', 'atenciones.turno_id', '=', 'turnos.id')
            ->whereIn('atenciones.estado', ['Completado', 'No Asistió'])
            ->where('atenciones.updated_at', '<', $limite)
            ->pluck('turnos.id');

        if ($completados->isNotEmpty()) {
            DB::table('turnos')->whereIn('id', $completados)->delete();
            $this->info("Eliminados {$completados->count()} turnos completados/no asistió.");
        }

        $this->info('Limpieza completada.');
    }
}
