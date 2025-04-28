<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\API\SensorController;
use App\Http\Controllers\API\SimulationController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public Air Quality Dashboard - No authentication required
Route::get('/air-quality', function () {
    return Inertia::render('public-dashboard');
})->name('air-quality');

// Basic dashboard route that redirects based on user role
Route::middleware(['auth', 'verified'])->get('dashboard', function () {
    if (auth()->user()->role === 'admin') {
        return redirect()->route('admin.dashboard');
    } elseif (auth()->user()->role === 'super_admin') {
        return redirect()->route('admin.super');
    }
    
    // Redirect regular users to home
    return redirect()->route('home')->with('error', 'You need admin privileges to access the dashboard.');
})->name('dashboard');

Route::get('/sample', [SampleController::class, 'index']);

// Admin routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Admin dashboard at /admin/dashboard
    Route::get('/admin/dashboard', function () {
        // Check if user has admin role
        if (auth()->user()->role !== 'admin') {
            return redirect()->route('home')->with('error', 'You need admin privileges to access this dashboard.');
        }
        
        return Inertia::render('admin/dashboard', [
            'role' => auth()->user()->role
        ]);
    })->name('admin.dashboard');
    
    // Sensor Management
    Route::get('/admin/sensors', function () {
        return Inertia::render('admin/sensors/index');
    })->name('admin.sensors');
    
    Route::get('/admin/sensors/create', function () {
        return Inertia::render('admin/sensors/create');
    })->name('admin.sensors.create');
    
    Route::get('/admin/sensors/{id}', function ($id) {
        return Inertia::render('admin/sensors/show', ['id' => $id]);
    })->name('admin.sensors.show');
    
    Route::get('/admin/sensors/{id}/edit', function ($id) {
        return Inertia::render('admin/sensors/edit', ['id' => $id]);
    })->name('admin.sensors.edit');
    
    Route::get('/admin/sensors/map', function () {
        return Inertia::render('admin/sensors/map');
    })->name('admin.sensors.map');
    
    // Simulation Management
    Route::get('/admin/simulation/config', function () {
        return Inertia::render('admin/simulation/config');
    })->name('admin.simulation.config');
    
    // Alert Management
    Route::get('/admin/alerts/thresholds', function () {
        return Inertia::render('admin/alerts/thresholds');
    })->name('admin.alerts.thresholds');
    
    Route::get('/admin/alerts/notifications', function () {
        return Inertia::render('admin/alerts/notifications');
    })->name('admin.alerts.notifications');
    
    Route::get('/admin/alerts/history', function () {
        return Inertia::render('admin/alerts/history');
    })->name('admin.alerts.history');
    
    // User Management
    Route::get('/admin/users', function () {
        return Inertia::render('admin/users/index');
    })->name('admin.users');
    
    Route::get('/admin/users/create', function () {
        return Inertia::render('admin/users/create');
    })->name('admin.users.create');
    
    // System Dashboard
    Route::get('/admin/system/dashboard', function () {
        return Inertia::render('admin/system/dashboard');
    })->name('admin.system.dashboard');
    
    Route::get('/admin/system/logs', function () {
        return Inertia::render('admin/system/logs');
    })->name('admin.system.logs');
    
    Route::get('/admin/reports', function () {
        return Inertia::render('admin/reports/index');
    })->name('admin.reports');
    
    // Super admin dashboard - only accessible by super_admin
    Route::get('/admin/super', [AdminController::class, 'superAdminDashboard'])->name('admin.super');
});

// This is a test route for sensors
Route::get('/test-sensors', [SensorController::class, 'index']);

// Direct API routes for sensors
Route::get('/api/sensors', [SensorController::class, 'index']);
Route::post('/api/sensors', [SensorController::class, 'store']);
Route::get('/api/sensors/readings/latest', [SensorController::class, 'getLastReadings']);
Route::get('/api/sensors/{id}/readings/latest', [SensorController::class, 'getSensorLastReading']);
Route::post('/api/sensors/{id}/readings', [SensorController::class, 'storeReading']);
Route::get('/api/sensors/{id}', [SensorController::class, 'show']);
Route::put('/api/sensors/{id}', [SensorController::class, 'update']);
Route::delete('/api/sensors/{id}', [SensorController::class, 'destroy']);
Route::patch('/api/sensors/{id}/activate', [SensorController::class, 'activate']);
Route::patch('/api/sensors/{id}/deactivate', [SensorController::class, 'deactivate']);

// Direct API routes for system
Route::get('/api/system/status', [\App\Http\Controllers\API\SystemController::class, 'getStatus']);
Route::get('/api/system/metrics', [\App\Http\Controllers\API\SystemController::class, 'getMetrics']);
Route::get('/api/system/logs', [\App\Http\Controllers\API\SystemController::class, 'getLogs']);
Route::post('/api/system/maintenance', [\App\Http\Controllers\API\SystemController::class, 'performMaintenance']);
Route::post('/api/system/restart', [\App\Http\Controllers\API\SystemController::class, 'restartService']);

// Direct API routes for simulation
Route::get('/api/simulation', [SimulationController::class, 'index']);
Route::put('/api/simulation', [SimulationController::class, 'update']);
Route::get('/api/simulation/config', [SimulationController::class, 'getConfig']);
Route::put('/api/simulation/config', [SimulationController::class, 'updateConfig']);
Route::post('/api/simulation/start', [SimulationController::class, 'start']);
Route::post('/api/simulation/stop', [SimulationController::class, 'stop']);
Route::get('/api/simulation/status', [SimulationController::class, 'status']);
Route::post('/api/simulation/patterns', [SimulationController::class, 'addPattern']);
Route::delete('/api/simulation/patterns/{type}', [SimulationController::class, 'removePattern']);

// Test route for manually triggering reading generation
Route::get('/api/simulation/generate-test', function() {
    if (App\Services\SimulationService::isRunning()) {
        $count = App\Services\SimulationService::generateReadings();
        return response()->json([
            'status' => 'success',
            'message' => "Generated readings for $count sensors",
        ]);
    } else {
        return response()->json([
            'status' => 'error',
            'message' => 'Simulation is not running. Start the simulation first.',
        ]);
    }
});

// API Fallback route for debugging
Route::fallback(function () {
    if (request()->is('api/*')) {
        return response()->json([
            'message' => 'Route not found.'
        ], 404);
    }
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
