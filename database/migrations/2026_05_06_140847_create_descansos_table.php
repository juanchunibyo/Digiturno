<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('descansos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asesor_id')->constrained('asesores')->cascadeOnDelete();
            $table->dateTime('inicio');
            $table->dateTime('fin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('descansos');
    }
};
