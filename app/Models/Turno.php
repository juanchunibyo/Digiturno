<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Turno extends Model
{
    protected $fillable = ['solicitante_id', 'turno_numero', 'tipo', 'hora_fecha'];

    protected $casts = [
        'hora_fecha' => 'datetime',
    ];

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(Solicitante::class);
    }

    public function atencion(): HasOne
    {
        return $this->hasOne(Atencion::class);
    }
}
