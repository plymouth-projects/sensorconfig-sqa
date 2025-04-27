<?php

namespace App\Services;

use App\Models\Sensor;
use App\Models\Reading;
use App\Models\SimulationConfig;
use Carbon\Carbon;

class SimulationService
{
    public static function generateReadings()
    {
        $config = SimulationConfig::first();
        if (!$config) {
            $config = SimulationConfig::create([
                'is_active' => false,
                'frequency' => 30,
                'baseline_aqi' => 50,
            ]);
        }
        
        $sensors = Sensor::all();
        $now = Carbon::now();
        
        foreach ($sensors as $sensor) {
            $lastReading = $sensor->readings()->latest('timestamp')->first();
            $baseAqi = $lastReading ? $lastReading->aqi : $config->baseline_aqi;
            
            // Calculate new AQI with variation
            $min = $config->variation_range['min'] ?? 10;
            $max = $config->variation_range['max'] ?? 30;
            $variation = mt_rand($min * 10, $max * 10) / 10; // For decimal precision
            $direction = (mt_rand(0, 1) == 1) ? 1 : -1;
            $newAqi = max(0, min(500, $baseAqi + ($direction * $variation)));
            
            // Create new reading
            Reading::create([
                'sensor_id' => $sensor->id,
                'timestamp' => $now,
                'aqi' => round($newAqi, 1),
                'pm25' => round($newAqi * 0.4 + (mt_rand(0, 50) / 10), 1),
                'pm10' => round($newAqi * 0.6 + (mt_rand(0, 100) / 10), 1),
            ]);
        }
        
        return $sensors->count();
    }
} 