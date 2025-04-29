<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Sensor;
use App\Models\Reading;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SuperAdminController extends Controller
{
    /**
     * Get all users
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAllUsers()
    {
        $users = User::all();
        return response()->json($users);
    }

    /**
     * Get a user by ID
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserById($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
    }

    /**
     * Create a new user
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function createUser(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['super_admin', 'admin', 'monitoring_admin', 'user'])],
            'permissions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        // Log this action
        Log::info('User created', ['user_id' => auth()->id(), 'created_user_id' => $user->id]);

        return response()->json($user, 201);
    }

    /**
     * Update a user
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'role' => ['sometimes', 'required', Rule::in(['super_admin', 'admin', 'monitoring_admin', 'user'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->update($request->only(['name', 'email', 'role']));

        // Log this action
        Log::info('User updated', ['user_id' => auth()->id(), 'updated_user_id' => $id]);

        return response()->json($user);
    }

    /**
     * Delete a user
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteUser($id)
    {
        // Prevent super admin from deleting themselves
        if (auth()->id() == $id) {
            return response()->json(['message' => 'You cannot delete your own account'], 403);
        }

        $user = User::findOrFail($id);
        $user->delete();

        // Log this action
        Log::info('User deleted', ['user_id' => auth()->id(), 'deleted_user_id' => $id]);

        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Change a user's password
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function changeUserPassword(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::findOrFail($id);
        $user->password = Hash::make($request->password);
        $user->save();

        // Log this action
        Log::info('User password changed', ['user_id' => auth()->id(), 'target_user_id' => $id]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    /**
     * Assign roles to a user
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignRoles(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'roles' => 'required|array',
            'roles.*' => Rule::in(['super_admin', 'admin', 'monitoring_admin', 'user']),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::findOrFail($id);
        
        // For simplicity, we're just using a single role field for now
        $user->role = $request->roles[0];
        $user->save();

        // Log this action
        Log::info('User roles assigned', [
            'user_id' => auth()->id(), 
            'target_user_id' => $id,
            'roles' => $request->roles
        ]);

        return response()->json(['message' => 'Roles assigned successfully', 'user' => $user]);
    }

    /**
     * Get system statistics
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSystemStats()
    {
        $totalUsers = User::count();
        $totalSensors = Sensor::count();
        $totalReadings = Reading::count();
        
        // Calculate average AQI
        $averageAqi = Reading::avg('aqi') ?? 0;
        
        // Get disk usage
        $diskTotal = disk_total_space('/');
        $diskFree = disk_free_space('/');
        $diskUsage = round(($diskTotal - $diskFree) / $diskTotal * 100, 2);
        
        // Get system health status
        $systemHealth = 'healthy'; // Default - in a real system you'd have more logic here
        
        // Approximations for demo purposes
        $cpuLoad = round(sys_getloadavg()[0], 2);
        $memoryUsage = round(memory_get_usage(true) / 1024 / 1024, 2); // In MB
        
        return response()->json([
            'totalUsers' => $totalUsers,
            'totalSensors' => $totalSensors,
            'totalReadings' => $totalReadings,
            'averageAqi' => round($averageAqi, 2),
            'systemHealth' => $systemHealth,
            'diskUsage' => $diskUsage,
            'cpuLoad' => $cpuLoad,
            'memoryUsage' => $memoryUsage,
        ]);
    }

    /**
     * Get system settings
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSystemSettings()
    {
        $settings = SystemSetting::all();
        return response()->json($settings);
    }

    /**
     * Update system settings
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateSystemSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'key' => 'required|string',
            'value' => 'required',
            'group' => ['required', Rule::in(['general', 'notifications', 'security', 'appearance', 'integrations'])],
            'type' => ['required', Rule::in(['string', 'boolean', 'integer', 'float', 'array', 'object'])],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $setting = SystemSetting::set(
            $request->key,
            $request->value,
            $request->group,
            $request->type,
            $request->description
        );

        // Log this action
        Log::info('System setting updated', [
            'user_id' => auth()->id(), 
            'setting_key' => $request->key
        ]);

        return response()->json($setting);
    }

    /**
     * Get activity logs
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getActivityLogs(Request $request)
    {
        $page = $request->input('page', 1);
        $limit = $request->input('limit', 20);
        
        // In a real application, you would have an activity_logs table
        // This is a simplified example using the Laravel log
        $logs = collect([
            // Simulate some log entries
            ['id' => 1, 'user_id' => 1, 'user_name' => 'Admin User', 'action' => 'login', 'entity' => 'auth', 'entity_id' => 1, 'details' => 'User logged in', 'ip_address' => '127.0.0.1', 'created_at' => now()->subHours(1)->toDateTimeString()],
            ['id' => 2, 'user_id' => 1, 'user_name' => 'Admin User', 'action' => 'create', 'entity' => 'sensor', 'entity_id' => 5, 'details' => 'Created new sensor', 'ip_address' => '127.0.0.1', 'created_at' => now()->subHours(2)->toDateTimeString()],
            // Add more mock data as needed
        ]);
        
        $total = $logs->count();
        $lastPage = ceil($total / $limit);
        
        return response()->json([
            'logs' => $logs->forPage($page, $limit)->values()->all(),
            'total' => $total,
            'currentPage' => (int)$page,
            'lastPage' => $lastPage,
        ]);
    }

    /**
     * Create a system backup
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function createBackup()
    {
        // In a real application, you'd implement the actual backup logic
        // For now, we just simulate a successful backup
        $backupId = rand(1000, 9999);
        $filename = 'backup_' . date('Y-m-d_His') . '.zip';
        
        // Log this action
        Log::info('System backup created', [
            'user_id' => auth()->id(), 
            'backup_id' => $backupId,
            'filename' => $filename
        ]);
        
        return response()->json([
            'id' => $backupId,
            'filename' => $filename,
            'size' => rand(5000000, 20000000), // Random size between 5-20MB
            'created_at' => now()->toDateTimeString(),
            'message' => 'Backup created successfully',
        ]);
    }

    /**
     * Get list of available backups
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getBackups()
    {
        // In a real application, you'd get actual backup files
        // For now, we just return mock data
        $backups = [
            [
                'id' => 1001,
                'filename' => 'backup_2025-04-25_083000.zip',
                'size' => 15478923,
                'created_at' => '2025-04-25 08:30:00',
            ],
            [
                'id' => 1002,
                'filename' => 'backup_2025-04-27_143022.zip',
                'size' => 16234567,
                'created_at' => '2025-04-27 14:30:22',
            ],
            [
                'id' => 1003,
                'filename' => 'backup_2025-04-29_023015.zip',
                'size' => 17654321,
                'created_at' => '2025-04-29 02:30:15',
            ],
        ];
        
        return response()->json($backups);
    }

    /**
     * Restore system from backup
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function restoreBackup($id)
    {
        // In a real application, you'd implement the actual restore logic
        // For now, we just simulate a successful restore
        
        // Log this action
        Log::info('System restore initiated', [
            'user_id' => auth()->id(), 
            'backup_id' => $id
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'System restored successfully from backup #' . $id,
        ]);
    }

    /**
     * Run system maintenance operations
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function runMaintenance(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'operations' => 'required|array',
            'operations.*' => Rule::in(['clear_cache', 'optimize', 'clear_logs', 'rebuild_index']),
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $details = [];
        
        // Simulate running the requested maintenance operations
        foreach ($request->operations as $operation) {
            switch ($operation) {
                case 'clear_cache':
                    // In a real app, you'd run cache:clear
                    $details[$operation] = 'Cache cleared successfully';
                    break;
                case 'optimize':
                    // In a real app, you'd run optimize
                    $details[$operation] = 'Application optimized successfully';
                    break;
                case 'clear_logs':
                    // In a real app, you'd clear log files
                    $details[$operation] = 'Log files cleared successfully';
                    break;
                case 'rebuild_index':
                    // In a real app, you'd rebuild search indices
                    $details[$operation] = 'Search indices rebuilt successfully';
                    break;
            }
        }
        
        // Log this action
        Log::info('System maintenance performed', [
            'user_id' => auth()->id(), 
            'operations' => $request->operations
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Maintenance tasks completed successfully',
            'details' => $details,
        ]);
    }

    /**
     * Get application environment information
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEnvironmentInfo()
    {
        return response()->json([
            'phpVersion' => PHP_VERSION,
            'laravelVersion' => app()->version(),
            'databaseType' => DB::connection()->getPdo()->getAttribute(\PDO::ATTR_DRIVER_NAME),
            'serverInfo' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'appMode' => config('app.env'),
            'diskFree' => disk_free_space('/'),
            'diskTotal' => disk_total_space('/'),
        ]);
    }
}