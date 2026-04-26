<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Solicitante extends Model
{
    protected $fillable = ['persona_id', 'tipo_solicitante'];

    public function persona(): BelongsTo
    {
        return $this->belongsTo(Persona::class);
    }

    public function turnos(): HasMany
    {
        return $this->hasMany(Turno::class);
    }
}
