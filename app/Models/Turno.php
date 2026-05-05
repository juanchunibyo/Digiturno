<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Turno extends Model
{
    protected $fillable = ['persona_id', 'turno_numero', 'tipo_turno_id', 'hora_fecha'];

    protected $casts = [
        'hora_fecha' => 'datetime',
    ];

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class);
    }

    public function tipoTurno(): BelongsTo
    {
        return $this->belongsTo(TipoTurno::class);
    }

    public function atencion(): HasOne
    {
        return $this->hasOne(Atencion::class);
    }
}
