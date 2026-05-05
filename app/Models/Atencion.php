<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Atencion extends Model
{
    protected $table = 'atenciones';

    protected $fillable = [
        'turno_id', 'asesor_id',
        'hora_inicio', 'hora_fin',
        'observaciones', 'estado_id',
    ];

    protected $casts = [
        'hora_inicio' => 'datetime',
        'hora_fin'    => 'datetime',
    ];

    public function turno(): BelongsTo
    {
        return $this->belongsTo(Turno::class);
    }

    public function asesor(): BelongsTo
    {
        return $this->belongsTo(Asesor::class);
    }

    public function estadoAtencion(): BelongsTo
    {
        return $this->belongsTo(EstadoAtencion::class, 'estado_id');
    }
}
