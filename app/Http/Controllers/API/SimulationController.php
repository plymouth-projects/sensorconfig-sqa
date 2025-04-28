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
        // Get actual configuration from database instead of mock
        $config = SimulationConfig::first();
        
        if (!$config) {
            $config = SimulationConfig::create([
                'is_active' => false,
                'frequency' => 60,
                'baseline_aqi' => 50,
                'variation_range' => ['min' => 10, 'max' => 30],
                'patterns' => [
                    [
                        'type' => 'random',
                        'intensity' => 5
                    ]
                ]
            ]);
        }
        
        // Return with both snake_case and camelCase for frontend compatibility
        return response()->json([
            'id' => $config->id,
            'is_active' => $config->is_active,
            'isActive' => $config->is_active,
            'frequency' => $config->frequency,
            'baseline_aqi' => $config->baseline_aqi,
            'baselineAqi' => $config->baseline_aqi,
            'variation_range' => $config->variation_range,
            'variationRange' => $config->variation_range,
            'patterns' => $config->patterns,
            'last_updated' => $config->updated_at->toIso8601String(),
            'lastUpdated' => $config->updated_at->toIso8601String()
        ]);
    }

    /**
     * Update the simulation configuration
     */
    public function update(Request $request)
    {
        return $this->updateConfig($request);
    }

    /**
     * Start the simulation
     */
    public function start()
    {
        // Use the enhanced SimulationService to start the simulation
        $result = SimulationService::startSimulation();
        
        return response()->json([
            'status' => $result['status'],
            'message' => $result['message']
        ]);
    }

    /**
     * Stop the simulation
     */
    public function stop()
    {
        // Use the enhanced SimulationService to stop the simulation
        $result = SimulationService::stopSimulation();
        
        return response()->json([
            'status' => $result['status'],
            'message' => $result['message']
        ]);
    }

    /**
     * Get simulation status
     */
    public function status()
    {
        // Get the status from the enhanced SimulationService
        $status = SimulationService::getStatus();
        
        // Get the generated readings count (can be improved with actual DB query)
        $generatedReadings = 0;
        $config = SimulationConfig::first();
        if ($config && isset($status['last_run'])) {
            $lastRun = \Carbon\Carbon::parse($status['last_run']);
            $frequency = $config->frequency ?? 30;
            $uptime = $status['uptime'];
            
            // Estimate number of readings generated based on uptime and frequency
            $generatedReadings = $status['sensors_affected'] * (int)($uptime / ($frequency * 60));
        }
        
        return response()->json([
            'status' => $status['status'],
            'lastRun' => $status['last_run'] ?? now()->toIsoString(),
            'uptime' => $status['uptime'],
            'sensorsAffected' => $status['sensors_affected'],
            'generatedReadings' => $generatedReadings
        ]);
    }

    /**
     * Add a new simulation pattern
     */
    public function addPattern(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:random,time-based,weather-based',
            'intensity' => 'required_if:type,random|nullable|numeric|min:1|max:10',
            'morning_peak' => 'required_if:type,time-based|nullable|numeric|min:0|max:100',
            'evening_peak' => 'required_if:type,time-based|nullable|numeric|min:0|max:100',
            'rain_effect' => 'required_if:type,weather-based|nullable|numeric|min:-50|max:50',
            'wind_effect' => 'required_if:type,weather-based|nullable|numeric|min:-50|max:50',
        ]);
        
        // Get the current config
        $config = SimulationConfig::first();
        if (!$config) {
            $config = SimulationConfig::create([
                'is_active' => false,
                'frequency' => 30,
                'baseline_aqi' => 50,
                'variation_range' => ['min' => 10, 'max' => 30],
                'patterns' => []
            ]);
        }
        
        // Get existing patterns or initialize an empty array
        $patterns = $config->patterns ?? [];
        
        // Create the new pattern with proper structure based on type
        $newPattern = ['type' => $validated['type']];
        
        switch ($validated['type']) {
            case 'random':
                $newPattern['intensity'] = (float) $validated['intensity'];
                break;
            case 'time-based':
                $newPattern['morning_peak'] = (float) $validated['morning_peak'];
                $newPattern['evening_peak'] = (float) $validated['evening_peak'];
                break;
            case 'weather-based':
                $newPattern['rain_effect'] = (float) $validated['rain_effect'];
                $newPattern['wind_effect'] = (float) $validated['wind_effect'];
                break;
        }
        
        // Remove any existing pattern with the same type
        $patterns = array_filter($patterns, function($pattern) use ($validated) {
            return $pattern['type'] !== $validated['type'];
        });
        
        // Add the new pattern
        $patterns[] = $newPattern;
        
        // Update the config with the new patterns array
        $config->patterns = $patterns;
        $config->save();
        
        // Return with both snake_case and camelCase for frontend compatibility
        return response()->json([
            'id' => $config->id,
            'is_active' => $config->is_active,
            'isActive' => $config->is_active,
            'frequency' => $config->frequency,
            'baseline_aqi' => $config->baseline_aqi,
            'baselineAqi' => $config->baseline_aqi,
            'variation_range' => $config->variation_range,
            'variationRange' => $config->variation_range,
            'patterns' => $config->patterns,
            'last_updated' => $config->updated_at->toIso8601String(),
            'lastUpdated' => $config->updated_at->toIso8601String()
        ]);
    }

    /**
     * Remove a simulation pattern
     */
    public function removePattern($type)
    {
        // Validate the pattern type
        if (!in_array($type, ['random', 'time-based', 'weather-based'])) {
            return response()->json([
                'error' => 'Invalid pattern type'
            ], 400);
        }
        
        // Get the current config
        $config = SimulationConfig::first();
        if (!$config) {
            return response()->json([
                'error' => 'No simulation configuration found'
            ], 404);
        }
        
        // Get existing patterns or initialize an empty array
        $patterns = $config->patterns ?? [];
        
        // Filter out the pattern with the specified type
        $patterns = array_filter($patterns, function($pattern) use ($type) {
            return $pattern['type'] !== $type;
        });
        
        // Re-index the array to ensure it's sequential
        $patterns = array_values($patterns);
        
        // Update the config with the new patterns array
        $config->patterns = $patterns;
        $config->save();
        
        // Return with both snake_case and camelCase for frontend compatibility
        return response()->json([
            'id' => $config->id,
            'is_active' => $config->is_active,
            'isActive' => $config->is_active,
            'frequency' => $config->frequency,
            'baseline_aqi' => $config->baseline_aqi,
            'baselineAqi' => $config->baseline_aqi,
            'variation_range' => $config->variation_range,
            'variationRange' => $config->variation_range,
            'patterns' => $config->patterns,
            'last_updated' => $config->updated_at->toIso8601String(),
            'lastUpdated' => $config->updated_at->toIso8601String()
        ]);
    }

    /**
     * Get the simulation configuration
     */
    public function getConfig()
    {
        $config = SimulationConfig::first();
        
        if (!$config) {
            $config = SimulationConfig::create([
                'is_active' => false,
                'frequency' => 30,
                'baseline_aqi' => 50,
                'variation_range' => ['min' => 10, 'max' => 30],
                'patterns' => []
            ]);
        }
        
        // Return with both snake_case and camelCase for frontend compatibility
        return response()->json([
            'id' => $config->id,
            'is_active' => $config->is_active,
            'isActive' => $config->is_active,
            'frequency' => $config->frequency,
            'baseline_aqi' => $config->baseline_aqi,
            'baselineAqi' => $config->baseline_aqi,
            'variation_range' => $config->variation_range,
            'variationRange' => $config->variation_range,
            'patterns' => $config->patterns,
            'last_updated' => $config->updated_at->toIso8601String(),
            'lastUpdated' => $config->updated_at->toIso8601String()
        ]);
    }
    
    /**
     * Update the simulation configuration
     */
    public function updateConfig(Request $request)
    {
        $validated = $request->validate([
            'is_active' => 'sometimes|boolean',
            'isActive' => 'sometimes|boolean',
            'frequency' => 'sometimes|integer|min:1',
            'baseline_aqi' => 'sometimes|numeric|min:0|max:500',
            'baselineAqi' => 'sometimes|numeric|min:0|max:500',
            'variation_range' => 'sometimes|array',
            'variationRange' => 'sometimes|array',
            'variation_range.min' => 'sometimes|numeric',
            'variation_range.max' => 'sometimes|numeric',
            'variationRange.min' => 'sometimes|numeric',
            'variationRange.max' => 'sometimes|numeric',
            'patterns' => 'sometimes|array',
        ]);
        
        // Convert camelCase to snake_case for consistency
        $configData = [];
        
        // Check if frequency is being updated to track changes
        $oldFrequency = null;
        $config = SimulationConfig::first();
        if ($config) {
            $oldFrequency = $config->frequency;
        }
        
        // Handle boolean fields
        if (isset($validated['is_active'])) {
            $configData['is_active'] = $validated['is_active'];
        } elseif (isset($validated['isActive'])) {
            $configData['is_active'] = $validated['isActive'];
        }
        
        // Handle numeric fields
        if (isset($validated['frequency'])) {
            $configData['frequency'] = $validated['frequency'];
        }
        
        if (isset($validated['baseline_aqi'])) {
            $configData['baseline_aqi'] = $validated['baseline_aqi'];
        } elseif (isset($validated['baselineAqi'])) {
            $configData['baseline_aqi'] = $validated['baselineAqi'];
        }
        
        // Handle variation range
        if (isset($validated['variation_range'])) {
            $configData['variation_range'] = $validated['variation_range'];
        } elseif (isset($validated['variationRange'])) {
            $configData['variation_range'] = [
                'min' => $validated['variationRange']['min'],
                'max' => $validated['variationRange']['max']
            ];
        } elseif (isset($validated['variationRange.min']) || isset($validated['variationRange.max'])) {
            // Handle dot notation if sent that way
            $currentRange = $config ? ($config->variation_range ?? ['min' => 10, 'max' => 30]) : ['min' => 10, 'max' => 30];
            
            $configData['variation_range'] = [
                'min' => $validated['variationRange.min'] ?? $currentRange['min'],
                'max' => $validated['variationRange.max'] ?? $currentRange['max']
            ];
        }
        
        // Handle patterns array
        if (isset($validated['patterns'])) {
            $configData['patterns'] = $validated['patterns'];
        }
        
        // Get or create the config
        if (!$config) {
            $config = SimulationConfig::create(array_merge([
                'is_active' => false,
                'frequency' => 30,
                'baseline_aqi' => 50,
                'variation_range' => ['min' => 10, 'max' => 30],
                'patterns' => []
            ], $configData));
        } else {
            $config->update($configData);
        }
        
        // Check if frequency was changed and refresh the settings if needed
        $newFrequency = $config->frequency;
        if (isset($configData['frequency']) && $oldFrequency !== $newFrequency) {
            \Illuminate\Support\Facades\Log::info("Frequency changed from {$oldFrequency} to {$newFrequency} seconds, refreshing simulation settings");
            \Illuminate\Support\Facades\Artisan::call('simulation:refresh-settings');
        }
        
        // Return the updated config with both snake_case and camelCase for frontend compatibility
        return response()->json([
            'id' => $config->id,
            'is_active' => $config->is_active,
            'isActive' => $config->is_active,
            'frequency' => $config->frequency,
            'baseline_aqi' => $config->baseline_aqi,
            'baselineAqi' => $config->baseline_aqi,
            'variation_range' => $config->variation_range,
            'variationRange' => $config->variation_range,
            'patterns' => $config->patterns,
            'last_updated' => $config->updated_at->toIso8601String(),
            'lastUpdated' => $config->updated_at->toIso8601String()
        ]);
    }
}