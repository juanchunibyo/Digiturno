<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asesor extends Model
{
    protected $table = 'asesores';

    protected $fillable = ['user_id', 'nro_contrato', 'tipo_asesor', 'vigencia', 'taquilla'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function atenciones(): HasMany
    {
        return $this->hasMany(Atencion::class);
    }
}
