<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sensor;
use App\Models\Reading;
use App\Models\SimulationConfig;
use Carbon\Carbon;

class SensorSeeder extends Seeder
{
    public function run()
    {
        // Create default simulation config
        SimulationConfig::create([
            'is_active' => false,
            'frequency' => 30,
            'baseline_aqi' => 50,
            'variation_range' => ['min' => 10, 'max' => 30],
            'patterns' => []
        ]);

        // Default sensor locations in Colombo
        $locations = [
            ['name' => 'Town Hall', 'location' => 'Colombo 07', 'lat' => 6.916, 'lng' => 79.863],
            ['name' => 'Pettah', 'location' => 'Colombo 11', 'lat' => 6.936, 'lng' => 79.849],
            ['name' => 'Dehiwala', 'location' => 'Colombo', 'lat' => 6.851, 'lng' => 79.862],
            ['name' => 'Wellawatte', 'location' => 'Colombo 06', 'lat' => 6.874, 'lng' => 79.859],
            ['name' => 'Bambalapitiya', 'location' => 'Colombo 04', 'lat' => 6.888, 'lng' => 79.856]
        ];

        $now = Carbon::now();

        foreach ($locations as $location) {
            $sensor = Sensor::create([
                'name' => $location['name'] . ' Sensor',
                'location' => $location['location'],
                'latitude' => $location['lat'],
                'longitude' => $location['lng'],
                'status' => 'active'
            ]);

            // Create initial reading
            Reading::create([
                'sensor_id' => $sensor->id,
                'timestamp' => $now,
                'aqi' => mt_rand(20, 170),
                'pm25' => mt_rand(10, 50),
                'pm10' => mt_rand(20, 70)
            ]);
        }

        // Create more sensors with random locations around Colombo
        for ($i = 1; $i <= 20; $i++) {
            // Random coordinates near Colombo
            $lat = 6.927 + (mt_rand(-100, 100) / 1000);
            $lng = 79.861 + (mt_rand(-100, 100) / 1000);

            $sensor = Sensor::create([
                'name' => "Sensor " . ($i + count($locations)),
                'location' => 'Colombo Area',
                'latitude' => $lat,
                'longitude' => $lng,
                'status' => 'active'
            ]);

            Reading::create([
                'sensor_id' => $sensor->id,
                'timestamp' => $now,
                'aqi' => mt_rand(20, 170),
                'pm25' => mt_rand(10, 50),
                'pm10' => mt_rand(20, 70)
            ]);
        }
    }
} 