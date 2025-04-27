<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Sensor;
use App\Models\Reading;
use App\Models\SimulationConfig;
use Illuminate\Http\Request;
use Carbon\Carbon;

class SystemController extends Controller
{
    public function getStatus()
    {
        $activeSensors = Sensor::where('status', 'active')->count();
        $alertsToday = 0; // Implement as needed
        $config = SimulationConfig::first();
        $simulationStatus = $config && $config->is_active ? 'running' : 'stopped';
        $lastReading = Reading::latest('timestamp')->first();
        
        return response()->json([
            'systemHealth' => 'healthy',
            'activeSensors' => $activeSensors,
            'simulationStatus' => $simulationStatus,
            'alertsToday' => $alertsToday,
            'lastDataUpdate' => $lastReading ? $lastReading->timestamp : null,
            'memoryUsage' => 42, // Mock value for demo
            'cpuLoad' => 28, // Mock value for demo
        ]);
    }
    
    public function getMetrics(Request $request)
    {
        $timespan = $request->input('timespan', 'day');
        
        // Define timespan in hours
        $hours = [
            'hour' => 1,
            'day' => 24,
            'week' => 168,
        ][$timespan] ?? 24;
        
        $startTime = Carbon::now()->subHours($hours);
        
        // Mock data for demo
        $data = [
            'timestamps' => [],
            'cpu' => [],
            'memory' => [],
            'activeUsers' => [],
            'apiRequests' => [],
        ];
        
        // Generate data points
        $points = ($timespan === 'hour') ? 12 : (($timespan === 'day') ? 24 : 7);
        
        for ($i = 0; $i < $points; $i++) {
            $data['timestamps'][] = Carbon::now()->subHours($hours * ($points - $i - 1) / $points)->toISOString();
            $data['cpu'][] = mt_rand(20, 70);
            $data['memory'][] = mt_rand(30, 70);
            $data['activeUsers'][] = mt_rand(5, 25);
            $data['apiRequests'][] = mt_rand(10, 100);
        }
        
        return response()->json($data);
    }
    
    public function getLogs(Request $request)
    {
        $limit = $request->input('limit', 100);
        $level = $request->input('level', 'all');
        
        // Mock logs for demo
        $logs = [];
        $types = ($level === 'all') ? ['info', 'warning', 'error'] : [$level];
        
        for ($i = 0; $i < $limit; $i++) {
            $type = $types[array_rand($types)];
            $logs[] = [
                'timestamp' => Carbon::now()->subMinutes(mt_rand(1, 1440))->toISOString(),
                'level' => $type,
                'message' => $this->getRandomLogMessage($type),
                'source' => ['System', 'Sensor', 'Auth', 'API', 'Database'][mt_rand(0, 4)],
            ];
        }
        
        return response()->json($logs);
    }
    
    private function getRandomLogMessage($level)
    {
        $messages = [
            'info' => [
                'System check completed successfully',
                'Sensor data collected from all active sensors',
                'User authentication succeeded',
                'Database backup completed',
            ],
            'warning' => [
                'Memory usage above 80%',
                'API rate limit reached',
                'Sensor response time degraded',
            ],
            'error' => [
                'Failed to connect to external service',
                'Invalid configuration detected',
                'Database query failed',
            ],
        ];
        
        $options = $messages[$level] ?? $messages['info'];
        return $options[array_rand($options)];
    }
} 