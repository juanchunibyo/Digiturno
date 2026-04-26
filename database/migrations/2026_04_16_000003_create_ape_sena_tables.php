<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tabla de Personas
        Schema::create('personas', function (Blueprint $table) {
            $table->id();
            $table->string('documento', 20)->unique()->comment('Equivalente a pers_doc pero en string para no perder ceros');
            $table->string('tipo_documento', 10)->nullable();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('telefono', 20)->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->timestamps();
        });

        // 2. Tabla Solicitantes (vinculado a persona)
        Schema::create('solicitantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('persona_id')->constrained('personas')->cascadeOnDelete();
            $table->string('tipo_solicitante', 45)->nullable();
            $table->timestamps();
        });

        // 3. Tabla Asesores (vinculado al User de Laravel)
        Schema::create('asesores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('nro_contrato', 45)->nullable();
            $table->string('tipo_asesor', 45)->nullable();
            $table->string('vigencia', 45)->nullable();
            $table->timestamps();
        });

        // 4. Tabla Coordinadores
        Schema::create('coordinadores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('vigencia', 45)->nullable();
            $table->timestamps();
        });

        // 5. Tabla Turnos
        Schema::create('turnos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('solicitante_id')->nullable()->constrained('solicitantes')->nullOnDelete();
            $table->string('turno_numero', 20)->unique();
            
            // Usamos string para que no explote si mañana el SENA agrega un nuevo tipo de atención ("Empresa", etc)
            $table->string('tipo', 45)->default('General')->comment('General, Prioritario, Victimas, Empresa, etc.');
            
            $table->dateTime('hora_fecha')->nullable();
            $table->timestamps();
        });

        // 6. Tabla Atenciones
        Schema::create('atenciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turno_id')->constrained('turnos')->cascadeOnDelete();
            $table->foreignId('asesor_id')->nullable()->constrained('asesores')->nullOnDelete();
            
            $table->string('tipo', 45)->default('General'); // Reemplaza al ENUM rígido
            
            // Tiempos exactos de atención
            $table->dateTime('hora_inicio')->nullable();
            $table->dateTime('hora_fin')->nullable();
            
            // Agregado adicional: Observaciones y Estado (basado en el frontend que diseñamos)
            $table->text('observaciones')->nullable();
            $table->string('estado', 30)->default('En Espera')->comment('En Espera, En Curso, Completado, No Asistió');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('atenciones');
        Schema::dropIfExists('turnos');
        Schema::dropIfExists('coordinadores');
        Schema::dropIfExists('asesores');
        Schema::dropIfExists('solicitantes');
        Schema::dropIfExists('personas');
    }
};
