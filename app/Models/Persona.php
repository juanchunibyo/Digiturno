<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Persona extends Model
{
    protected $fillable = [
        'documento', 'tipo_documento', 'nombres', 'apellidos', 'telefono', 'fecha_nacimiento',
    ];

    public function solicitantes(): HasMany
    {
        return $this->hasMany(Solicitante::class);
    }
}
