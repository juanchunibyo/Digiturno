<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Coordinador extends Model
{
    protected $table = 'coordinadores';

    protected $fillable = ['user_id', 'vigencia'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
