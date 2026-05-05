<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoTurno extends Model
{
    protected $table = 'tipos_turno';
    
    protected $fillable = ['nombre'];

    public function turnos(): HasMany
    {
        return $this->hasMany(Turno::class, 'tipo_turno_id');
    }
}
