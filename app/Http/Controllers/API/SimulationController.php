<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SimulationConfig;
use App\Services\SimulationService;
use Illuminate\Http\Request;

class SimulationController extends Controller
{
    /**
     * Get the current simulation configuration
     */
    public function index()
    {
        // Mock implementation
        return response()->json([
            'id' => 1,
            'isActive' => true,
            'frequency' => 60,
            'baselineAqi' => 50,
            'variationRange' => [
                'min' => 10,
                'max' => 30
            ],
            'patterns' => [
                [
                    'type' => 'random',
                    'intensity' => 5
                ],
                [
                    'type' => 'time-based',
                    'morningPeak' => 20,
                    'eveningPeak' => 30
                ]
            ],
            'lastUpdated' => now()->toISOString()
        ]);
    }

    /**
     * Update the simulation configuration
     */
    public function update(Request $request)
    {
        // Mock implementation
        return response()->json([
            'id' => 1,
            'isActive' => $request->isActive ?? true,
            'frequency' => $request->frequency ?? 60,
            'baselineAqi' => $request->baselineAqi ?? 50,
            'variationRange' => $request->variationRange ?? [
                'min' => 10,
                'max' => 30
            ],
            'patterns' => $request->patterns ?? [],
            'lastUpdated' => now()->toISOString()
        ]);
    }

    /**
     * Start the simulation
     */
    public function start()
    {
        // Update session state
        request()->session()->put('simulation_action', 'running');
        
        // Mock implementation
        return response()->json([
            'status' => 'running',
            'message' => 'Simulation started successfully'
        ]);
    }

    /**
     * Stop the simulation
     */
    public function stop()
    {
        // Update session state
        request()->session()->put('simulation_action', 'stopped');
        
        // Mock implementation
        return response()->json([
            'status' => 'stopped',
            'message' => 'Simulation stopped successfully'
        ]);
    }

    /**
     * Get simulation status
     */
    public function status()
    {
        // We'll make this check if simulation has been stopped
        // Check if the most recent action was a stop action (simplified mock)
        $recentAction = request()->session()->get('simulation_action', 'running');

        return response()->json([
            'status' => $recentAction === 'stopped' ? 'stopped' : 'running',
            'lastRun' => now()->subMinutes(5)->toISOString(),
            'uptime' => 3600, // seconds
            'sensorsAffected' => 3,
            'generatedReadings' => 180
        ]);
    }

    /**
     * Add a new simulation pattern
     */
    public function addPattern(Request $request)
    {
        // Mock implementation
        return response()->json([
            'id' => 1,
            'isActive' => true,
            'frequency' => 60,
            'baselineAqi' => 50,
            'variationRange' => [
                'min' => 10,
                'max' => 30
            ],
            'patterns' => [
                [
                    'type' => 'random',
                    'intensity' => 5
                ],
                [
                    'type' => 'time-based',
                    'morningPeak' => 20,
                    'eveningPeak' => 30
                ],
                $request->all()
            ],
            'lastUpdated' => now()->toISOString()
        ]);
    }

    /**
     * Remove a simulation pattern
     */
    public function removePattern($type)
    {
        // Mock implementation
        return response()->json([
            'id' => 1,
            'isActive' => true,
            'frequency' => 60,
            'baselineAqi' => 50,
            'variationRange' => [
                'min' => 10,
                'max' => 30
            ],
            'patterns' => [
                [
                    'type' => 'random',
                    'intensity' => 5
                ]
            ],
            'lastUpdated' => now()->toISOString()
        ]);
    }

    public function getConfig()
    {
        $config = SimulationConfig::first();
        
        if (!$config) {
            $config = SimulationConfig::create([
                'is_active' => false,
                'frequency' => 30,
                'baseline_aqi' => 50,
            ]);
        }
        
        return response()->json($config);
    }
    
    public function updateConfig(Request $request)
    {
        $validated = $request->validate([
            'frequency' => 'sometimes|integer|min:1',
            'baseline_aqi' => 'sometimes|numeric|min:0|max:500',
            'variation_range' => 'sometimes|array',
            'variation_range.min' => 'required_with:variation_range|numeric',
            'variation_range.max' => 'required_with:variation_range|numeric',
            'patterns' => 'sometimes|array',
        ]);
        
        $config = SimulationConfig::first();
        
        if (!$config) {
            $config = SimulationConfig::create(array_merge([
                'is_active' => false,
                'frequency' => 30,
                'baseline_aqi' => 50,
            ], $validated));
        } else {
            $config->update($validated);
        }
        
        return response()->json($config);
    }
    
    public function startSimulation()
    {
        $config = SimulationConfig::first();
        
        if (!$config) {
            $config = SimulationConfig::create([
                'is_active' => true,
                'frequency' => 30,
                'baseline_aqi' => 50,
            ]);
        } else {
            $config->update(['is_active' => true]);
        }
        
        // Generate initial readings
        $sensorsUpdated = SimulationService::generateReadings();
        
        return response()->json([
            'status' => 'success',
            'message' => "Simulation started successfully. Generated readings for {$sensorsUpdated} sensors."
        ]);
    }
    
    public function stopSimulation()
    {
        $config = SimulationConfig::first();
        
        if ($config) {
            $config->update(['is_active' => false]);
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'Simulation stopped successfully'
        ]);
    }
} 