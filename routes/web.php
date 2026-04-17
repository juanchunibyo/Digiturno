<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/seleccion', function () {
    return Inertia::render('SeleccionPoblacion');
});

Route::get('/registro', function () {
    return Inertia::render('Registro');
});

Route::get('/dashboard-asesor', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard.asesor');

Route::get('/dashboard-coordinador', function () {
    return Inertia::render('CoordinadorDashboard');
})->middleware(['auth', 'verified'])->name('dashboard.coordinador');

Route::get('/dashboard', function () {
    $user = request()->user();
    if (str_contains(strtolower($user->email), 'coordinador') || str_contains(strtolower($user->name), 'coordinador')) {
        return redirect()->route('dashboard.coordinador');
    }
    return redirect()->route('dashboard.asesor');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
