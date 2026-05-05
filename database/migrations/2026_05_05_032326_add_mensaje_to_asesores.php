<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('asesores', function (Blueprint $table) {
            if (!Schema::hasColumn('asesores', 'activo')) {
                $table->boolean('activo')->default(true);
            }
            if (!Schema::hasColumn('asesores', 'mensaje_coordinador')) {
                $table->text('mensaje_coordinador')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asesores', function (Blueprint $table) {
            $table->dropColumn(['activo', 'mensaje_coordinador']);
        });
    }
};
