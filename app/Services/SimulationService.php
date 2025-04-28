<?php

namespace App\Services;

use App\Models\Sensor;
use App\Models\Reading;
use App\Models\SimulationConfig;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SimulationService
{
    // Cache key for simulation status
    const SIMULATION_STATUS_KEY = 'simulation_status';
    const SIMULATION_LAST_RUN_KEY = 'simulation_last_run';
    
    // AQI category thresholds as per EPA standards
    const AQI_CATEGORIES = [
        'good' => [0, 50],
        'moderate' => [51, 100],
        'unhealthy_sensitive' => [101, 150],
        'unhealthy' => [151, 200],
        'very_unhealthy' => [201, 300],
        'hazardous' => [301, 500]
    ];

    /**
     * Generate new sensor readings based on simulation configuration
     * 
     * @return int Number of sensors updated
     */
    public static function generateReadings()
    {
        // First check if the simulation is running
        if (!self::isRunning()) {
            Log::warning("Attempted to generate readings while simulation is not running");
            return 0;
        }
        
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
        
        $sensors = Sensor::all();
        $now = Carbon::now();
        $updatedCount = 0;
        
        // Environmental factors that affect all sensors (shared context)
        $environmentalFactors = self::generateEnvironmentalFactors($now);
        
        foreach ($sensors as $sensor) {
            // Generate a reading based on configuration, sensor context, and environmental factors
            $reading = self::generateSensorReading($sensor, $config, $now, $environmentalFactors);
            
            // Only save the reading to the database if the simulation is running
            // Double-check the simulation state to make sure it hasn't been stopped
            if (self::isRunning()) {
                Reading::create($reading);
                $updatedCount++;
            } else {
                // Simulation was stopped while processing, break the loop
                Log::info("Simulation stopped during reading generation process");
                break;
            }
        }
        
        if ($updatedCount > 0) {
            // Update last run time
            self::updateLastRunTime();
            
            // Log the operation
            Log::info("Simulation: Generated $updatedCount sensor readings");
        }
        
        return $updatedCount;
    }
    
    /**
     * Generate environmental factors that affect all sensors
     * 
     * @param Carbon $timestamp Current timestamp
     * @return array Environmental factors
     */
    private static function generateEnvironmentalFactors(Carbon $timestamp)
    {
        // Time factors
        $hour = (int) $timestamp->format('H');
        $weekday = (int) $timestamp->format('N'); // 1 (Monday) to 7 (Sunday)
        $isWeekend = $weekday >= 6;
        
        // Weather simulation (random for demonstration)
        $weather = [
            'temperature' => mt_rand(5, 35), // 5°C to 35°C
            'humidity' => mt_rand(30, 90), // 30% to 90%
            'wind_speed' => mt_rand(0, 30), // 0 to 30 km/h
            'precipitation' => mt_rand(0, 100) < 30, // 30% chance of precipitation
        ];
        
        // Traffic conditions based on time of day and weekday/weekend
        $trafficFactor = self::calculateTrafficFactor($hour, $isWeekend);
        
        return [
            'hour' => $hour,
            'weekday' => $weekday,
            'isWeekend' => $isWeekend,
            'weather' => $weather,
            'trafficFactor' => $trafficFactor,
        ];
    }
    
    /**
     * Calculate traffic factor based on time of day and weekday/weekend
     * 
     * @param int $hour Hour of day (0-23)
     * @param bool $isWeekend Whether it's a weekend
     * @return float Traffic factor (0-1)
     */
    private static function calculateTrafficFactor($hour, $isWeekend)
    {
        // Base traffic factor
        $factor = 0.3;
        
        // Weekday rush hours
        if (!$isWeekend) {
            // Morning rush hour (7-9 AM)
            if ($hour >= 7 && $hour <= 9) {
                $factor = 0.8;
            }
            // Evening rush hour (4-7 PM)
            elseif ($hour >= 16 && $hour <= 19) {
                $factor = 0.9;
            }
            // Mid-day
            elseif ($hour >= 10 && $hour <= 15) {
                $factor = 0.5;
            }
            // Night time
            elseif ($hour >= 22 || $hour <= 5) {
                $factor = 0.1;
            }
        } else {
            // Weekend patterns
            // Mid-day shopping hours
            if ($hour >= 10 && $hour <= 18) {
                $factor = 0.6;
            }
            // Evening social hours
            elseif ($hour >= 19 && $hour <= 23) {
                $factor = 0.7;
            }
            // Early morning
            else {
                $factor = 0.2;
            }
        }
        
        // Add some randomness (±10%)
        $factor += (mt_rand(-10, 10) / 100);
        
        // Ensure factor is between 0 and 1
        return max(0, min(1, $factor));
    }
    
    /**
     * Generate a reading for a specific sensor
     * 
     * @param Sensor $sensor The sensor
     * @param SimulationConfig $config Simulation configuration
     * @param Carbon $timestamp Current timestamp
     * @param array $environmentalFactors Shared environmental factors
     * @return array Reading data
     */
    private static function generateSensorReading($sensor, $config, $timestamp, $environmentalFactors)
    {
        // Get the sensor's previous reading or use baseline
        $lastReading = $sensor->readings()->latest('timestamp')->first();
        $baseAqi = $lastReading ? $lastReading->aqi : $config->baseline_aqi;
        
        // Calculate new AQI value based on various factors
        $newAqi = self::calculateAqi($baseAqi, $config, $sensor, $timestamp, $environmentalFactors);
        
        // Derive PM2.5 and PM10 values based on AQI
        // These formulas are simplified approximations
        $pm25 = self::derivePM25FromAQI($newAqi);
        $pm10 = self::derivePM10FromAQI($newAqi);
        
        // Return structured reading data
        return [
            'sensor_id' => $sensor->id,
            'timestamp' => $timestamp,
            'aqi' => round($newAqi, 1),
            'pm25' => round($pm25, 1),
            'pm10' => round($pm10, 1),
        ];
    }
    
    /**
     * Calculate AQI based on baseline and various factors
     * 
     * @param float $baseAqi Base AQI value
     * @param SimulationConfig $config Simulation configuration
     * @param Sensor $sensor The sensor
     * @param Carbon $timestamp Current timestamp
     * @param array $environmentalFactors Shared environmental factors
     * @return float New AQI value
     */
    private static function calculateAqi($baseAqi, $config, $sensor, $timestamp, $environmentalFactors)
    {
        // 1. Start with base AQI
        $newAqi = $baseAqi;
        
        // 2. Apply configuration-based variation
        $newAqi = self::applyBaseVariation($newAqi, $config);
        
        // 3. Apply location-specific factors
        $newAqi = self::applyLocationFactors($newAqi, $sensor, $environmentalFactors);
        
        // 4. Apply environmental factors
        $newAqi = self::applyEnvironmentalFactors($newAqi, $environmentalFactors);
        
        // 5. Apply configured patterns
        $newAqi = self::applyConfiguredPatterns($newAqi, $config, $timestamp, $sensor);
        
        // 6. Ensure AQI is within valid range (0-500)
        return max(0, min(500, $newAqi));
    }
    
    /**
     * Apply base variation from configuration
     * 
     * @param float $aqi Current AQI value
     * @param SimulationConfig $config Simulation configuration
     * @return float Modified AQI value
     */
    private static function applyBaseVariation($aqi, $config)
    {
        $min = $config->variation_range['min'] ?? 10;
        $max = $config->variation_range['max'] ?? 30;
        
        // Calculate variation amount
        $variation = mt_rand($min * 10, $max * 10) / 10;
        
        // Determine direction (increase or decrease)
        $direction = (mt_rand(0, 1) == 1) ? 1 : -1;
        
        // Apply variation
        return $aqi + ($direction * $variation);
    }
    
    /**
     * Apply location-specific factors to AQI
     * 
     * @param float $aqi Current AQI value
     * @param Sensor $sensor The sensor
     * @param array $environmentalFactors Shared environmental factors
     * @return float Modified AQI value
     */
    private static function applyLocationFactors($aqi, $sensor, $environmentalFactors)
    {
        // For now, simulate urban vs rural differences
        // In a real system, we would use the sensor's actual location data
        
        // Assume sensors with odd IDs are in urban areas, even IDs in suburban/rural areas
        $isUrban = $sensor->id % 2 == 1;
        
        // Urban areas are more affected by traffic
        if ($isUrban) {
            // Urban areas get up to 40% more pollution during high traffic times
            $trafficImpact = $environmentalFactors['trafficFactor'] * 0.4;
            $aqi *= (1 + $trafficImpact);
        } else {
            // Suburban/rural areas get up to 15% more pollution during high traffic times
            $trafficImpact = $environmentalFactors['trafficFactor'] * 0.15;
            $aqi *= (1 + $trafficImpact);
        }
        
        return $aqi;
    }
    
    /**
     * Apply environmental factors to AQI
     * 
     * @param float $aqi Current AQI value
     * @param array $environmentalFactors Shared environmental factors
     * @return float Modified AQI value
     */
    private static function applyEnvironmentalFactors($aqi, $environmentalFactors)
    {
        $weather = $environmentalFactors['weather'];
        
        // Rain helps clear air pollution
        if ($weather['precipitation']) {
            $aqi *= 0.85; // Reduce by 15%
        }
        
        // Wind speed affects pollution dispersion
        if ($weather['wind_speed'] > 15) {
            // Strong wind disperses pollution
            $aqi *= 0.9; // Reduce by 10%
        } elseif ($weather['wind_speed'] < 5) {
            // Low wind allows pollution to accumulate
            $aqi *= 1.1; // Increase by 10%
        }
        
        // Temperature inversions trap pollution (common in mornings)
        $hour = $environmentalFactors['hour'];
        if ($hour >= 5 && $hour <= 8) {
            $aqi *= 1.15; // Increase by 15%
        }
        
        return $aqi;
    }
    
    /**
     * Apply configured simulation patterns to AQI
     * 
     * @param float $aqi Current AQI value
     * @param SimulationConfig $config Simulation configuration
     * @param Carbon $timestamp Current timestamp
     * @param Sensor $sensor The sensor
     * @return float Modified AQI value
     */
    private static function applyConfiguredPatterns($aqi, $config, $timestamp, $sensor)
    {
        if (!isset($config->patterns) || !is_array($config->patterns)) {
            return $aqi;
        }
        
        foreach ($config->patterns as $pattern) {
            if (!isset($pattern['type'])) {
                continue;
            }
            
            switch ($pattern['type']) {
                case 'random':
                    // Apply random variation based on pattern intensity
                    $intensity = $pattern['intensity'] ?? 5;
                    $randomFactor = (mt_rand(-10, 10) / 10) * $intensity;
                    $aqi += $randomFactor;
                    break;
                    
                case 'time-based':
                    // Apply time-based variations
                    $hour = (int) $timestamp->format('H');
                    $morningPeak = $pattern['morningPeak'] ?? 20;
                    $eveningPeak = $pattern['eveningPeak'] ?? 30;
                    
                    // Morning peak (7-9 AM)
                    if ($hour >= 7 && $hour <= 9) {
                        $factor = $morningPeak / 100;
                        $aqi *= (1 + $factor);
                    }
                    // Evening peak (5-7 PM)
                    elseif ($hour >= 17 && $hour <= 19) {
                        $factor = $eveningPeak / 100;
                        $aqi *= (1 + $factor);
                    }
                    break;
                    
                case 'weather-based':
                    // Simulated weather effects
                    $rainEffect = $pattern['rainEffect'] ?? -20;
                    $windEffect = $pattern['windEffect'] ?? -30;
                    
                    // Randomly simulate rain (10% chance)
                    if (mt_rand(1, 10) === 1) {
                        $rainFactor = $rainEffect / 100;
                        $aqi *= (1 + $rainFactor);
                    }
                    
                    // Randomly simulate wind (20% chance)
                    if (mt_rand(1, 5) === 1) {
                        $windFactor = $windEffect / 100;
                        $aqi *= (1 + $windFactor);
                    }
                    break;
            }
        }
        
        return $aqi;
    }
    
    /**
     * Derive PM2.5 value from AQI
     * 
     * @param float $aqi AQI value
     * @return float PM2.5 value
     */
    private static function derivePM25FromAQI($aqi)
    {
        // This is a simplified approximation
        // In reality, AQI calculation from PM2.5 is more complex and non-linear
        
        // Base conversion with some randomness
        $pm25 = ($aqi * 0.55) + mt_rand(-5, 5);
        
        // Ensure minimum value
        return max(0, $pm25);
    }
    
    /**
     * Derive PM10 value from AQI
     * 
     * @param float $aqi AQI value
     * @return float PM10 value
     */
    private static function derivePM10FromAQI($aqi)
    {
        // This is a simplified approximation
        // In reality, AQI calculation from PM10 is more complex and non-linear
        
        // PM10 is typically higher than PM2.5
        $pm10 = ($aqi * 0.8) + mt_rand(-10, 10);
        
        // Ensure minimum value
        return max(0, $pm10);
    }
    
    /**
     * Start the simulation
     */
    public static function startSimulation()
    {
        // Set simulation status to running
        Cache::forever(self::SIMULATION_STATUS_KEY, 'running');
        
        // Generate initial readings
        $count = self::generateReadings();
        
        // Record the start time
        self::updateLastRunTime();
        
        Log::info("Simulation started with $count sensor readings generated");
        
        return [
            'status' => 'success',
            'message' => "Simulation started successfully. Generated readings for $count sensors.",
            'sensors_affected' => $count
        ];
    }
    
    /**
     * Stop the simulation
     */
    public static function stopSimulation()
    {
        // Set simulation status to stopped
        Cache::forever(self::SIMULATION_STATUS_KEY, 'stopped');
        
        Log::info("Simulation stopped");
        
        return [
            'status' => 'success',
            'message' => 'Simulation stopped successfully'
        ];
    }
    
    /**
     * Get current simulation status
     */
    public static function getStatus()
    {
        $status = Cache::get(self::SIMULATION_STATUS_KEY, 'stopped');
        $lastRun = Cache::get(self::SIMULATION_LAST_RUN_KEY);
        
        $uptime = 0;
        if ($status === 'running' && $lastRun) {
            $uptime = Carbon::parse($lastRun)->diffInSeconds(Carbon::now());
        }
        
        return [
            'status' => $status,
            'last_run' => $lastRun,
            'uptime' => $uptime,
            'sensors_affected' => Sensor::count()
        ];
    }
    
    /**
     * Check if simulation is running
     */
    public static function isRunning()
    {
        return Cache::get(self::SIMULATION_STATUS_KEY, 'stopped') === 'running';
    }
    
    /**
     * Update the last run time to current time
     */
    private static function updateLastRunTime()
    {
        Cache::forever(self::SIMULATION_LAST_RUN_KEY, Carbon::now()->toIso8601String());
    }
}