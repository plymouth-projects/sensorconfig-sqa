<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sensor;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    /**
     * Display a listing of the sensors.
     */
    public function index()
    {
        $sensors = Sensor::with('lastReading')->get();
        
        // Ensure each sensor has the expected location structure
        $sensors = $sensors->map(function ($sensor) {
            $data = $sensor->toArray();
            
            // Make sure the location field is properly structured
            if (!isset($data['location'])) {
                $data['location'] = [
                    'lat' => $sensor->latitude ?? 0,
                    'lng' => $sensor->longitude ?? 0,
                    'address' => $sensor->location ?? 'Unknown location'
                ];
            }
            
            return $data;
        });
        
        return response()->json($sensors);
    }

    /**
     * Store a newly created sensor.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);
        
        $sensor = Sensor::create($validated);
        
        return response()->json($sensor, 201);
    }

    /**
     * Display the specified sensor.
     */
    public function show(Sensor $sensor)
    {
        $sensor->load('lastReading');
        
        $data = $sensor->toArray();
        
        // Make sure the location field is properly structured
        if (!isset($data['location'])) {
            $data['location'] = [
                'lat' => $sensor->latitude ?? 0,
                'lng' => $sensor->longitude ?? 0,
                'address' => $sensor->location ?? 'Unknown location'
            ];
        }
        
        return response()->json($data);
    }

    /**
     * Update the specified sensor.
     */
    public function update(Request $request, Sensor $sensor)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);
        
        $sensor->update($validated);
        
        return response()->json($sensor);
    }

    /**
     * Remove the specified sensor.
     */
    public function destroy(Sensor $sensor)
    {
        $sensor->delete();
        
        return response()->json(null, 204);
    }

    /**
     * Activate the specified sensor.
     */
    public function activate($id)
    {
        // Mock implementation
        return response()->json([
            'id' => (int) $id,
            'status' => 'active',
            'updatedAt' => now()->toISOString()
        ]);
    }

    /**
     * Deactivate the specified sensor.
     */
    public function deactivate($id)
    {
        // Mock implementation
        return response()->json([
            'id' => (int) $id,
            'status' => 'inactive',
            'updatedAt' => now()->toISOString()
        ]);
    }

    /**
     * Get the last readings for all sensors.
     */
    public function getLastReadings()
    {
        $sensors = Sensor::with('lastReading')->get();
        
        $readings = $sensors->map(function ($sensor) {
            // Format the location data properly
            $location = [
                'lat' => $sensor->latitude,
                'lng' => $sensor->longitude,
                'address' => $sensor->location
            ];
            
            return [
                'sensor_id' => $sensor->id,
                'sensor_name' => $sensor->name,
                'sensor_location' => $location,
                'reading' => $sensor->lastReading ? [
                    'id' => $sensor->lastReading->id,
                    'timestamp' => $sensor->lastReading->timestamp,
                    'aqi' => $sensor->lastReading->aqi,
                    'pm25' => $sensor->lastReading->pm25,
                    'pm10' => $sensor->lastReading->pm10,
                ] : null
            ];
        });
        
        return response()->json($readings);
    }
    
    /**
     * Get the last reading for a specific sensor.
     */
    public function getSensorLastReading($id)
    {
        $sensor = Sensor::with('lastReading')->findOrFail($id);
        
        if (!$sensor->lastReading) {
            return response()->json(['message' => 'No readings found for this sensor'], 404);
        }
        
        // Format the location data properly
        $location = [
            'lat' => $sensor->latitude,
            'lng' => $sensor->longitude,
            'address' => $sensor->location
        ];
        
        return response()->json([
            'sensor_id' => $sensor->id,
            'sensor_name' => $sensor->name,
            'sensor_location' => $location,
            'reading' => [
                'id' => $sensor->lastReading->id,
                'timestamp' => $sensor->lastReading->timestamp,
                'aqi' => $sensor->lastReading->aqi,
                'pm25' => $sensor->lastReading->pm25,
                'pm10' => $sensor->lastReading->pm10,
            ]
        ]);
    }
} 