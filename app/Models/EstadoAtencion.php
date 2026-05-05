<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EstadoAtencion extends Model
{
    protected $table = 'estados_atencion';
    
    protected $fillable = ['nombre'];

    public function atenciones(): HasMany
    {
        return $this->hasMany(Atencion::class, 'estado_id');
    }
}
