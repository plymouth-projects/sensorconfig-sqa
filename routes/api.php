<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\SensorController;
use App\Http\Controllers\API\SimulationController;
use App\Http\Controllers\API\SystemController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// User route (with authentication)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Sensor routes - NO authentication required
Route::get('/sensors', [SensorController::class, 'index']);
Route::post('/sensors', [SensorController::class, 'store']);
Route::get('/sensors/{id}', [SensorController::class, 'show']);
Route::put('/sensors/{id}', [SensorController::class, 'update']);
Route::delete('/sensors/{id}', [SensorController::class, 'destroy']);
Route::patch('/sensors/{id}/activate', [SensorController::class, 'activate']);
Route::patch('/sensors/{id}/deactivate', [SensorController::class, 'deactivate']);
Route::get('/sensors/readings/latest', [SensorController::class, 'getLastReadings']);
Route::get('/sensors/{id}/readings/latest', [SensorController::class, 'getSensorLastReading']);

// Fallback route for debugging
Route::fallback(function () {
    return response()->json([
        'message' => 'Route not found.'
    ], 404);
}); 