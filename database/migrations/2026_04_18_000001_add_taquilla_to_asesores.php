<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('asesores', 'taquilla')) {
            Schema::table('asesores', function (Blueprint $table) {
                $table->string('taquilla', 45)->nullable()->after('tipo_asesor');
            });
        }
    }

    public function down(): void
    {
        Schema::table('asesores', function (Blueprint $table) {
            $table->dropColumn('taquilla');
        });
    }
};
