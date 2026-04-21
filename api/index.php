<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// 1. Redirigir Storage a /tmp (Imprescindible en Vercel)
$storagePath = '/tmp/storage';
foreach (['/framework/views', '/framework/cache', '/framework/sessions', '/framework/testing'] as $path) {
    if (!is_dir($storagePath . $path)) {
        mkdir($storagePath . $path, 0755, true);
    }
}

// 2. Cargar Composer
require __DIR__ . '/../vendor/autoload.php';

// 3. Obtener la instancia de la App
/** @var Application $app */
$app = require_once __DIR__ . '/../bootstrap/app.php';

// 4. Forzar el uso de la carpeta temporal para evitar Errores 500 de escritura
$app->useStoragePath($storagePath);

// 5. Manejar la petición
$app->handleRequest(Request::capture());
