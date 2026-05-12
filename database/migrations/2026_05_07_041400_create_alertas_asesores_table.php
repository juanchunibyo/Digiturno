<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alertas_asesores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asesor_id')->constrained('asesores')->cascadeOnDelete();
            $table->string('tipo', 50)->comment('Demora Descanso, Demora Espera, etc.');
            $table->integer('duracion_minutos');
            $table->string('estado_asesor', 30);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alertas_asesores');
    }
};
