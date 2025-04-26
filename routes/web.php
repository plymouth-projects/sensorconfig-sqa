<?php

use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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
    
    // Super admin dashboard - only accessible by super_admin
    Route::get('/admin/super', [AdminController::class, 'superAdminDashboard'])->name('admin.super');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
