<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    /**
     * Show the super admin dashboard.
     */
    public function superAdminDashboard(): Response
    {
        // Check if user has super_admin role
        if (auth()->user()->role !== 'super_admin') {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to access this page.');
        }

        return Inertia::render('superadmin/dashboard', [
            'role' => auth()->user()->role,
        ]);
    }
    
    /**
     * Show the user management page.
     */
    public function users(): Response
    {
        try {
            $users = User::all()
                ->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'email_verified_at' => $user->email_verified_at,
                        'created_at' => $user->created_at,
                    ];
                });

            return Inertia::render('superadmin/users/index', [
                'users' => $users,
                'success' => session('success'),
                'error' => session('error')
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch users: ' . $e->getMessage());
            return redirect()->route('dashboard')->with('error', 'Failed to load user management page.');
        }
    }

    /**
     * Show the create user page.
     */
    public function createUser(): Response
    {
        return Inertia::render('superadmin/users/create');
    }

    /**
     * Store a new admin user.
     */
    public function storeUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Password::defaults()],
            'role' => ['required', Rule::in('admin','user')],
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'email_verified_at' => now(), // Auto-verify admin emails
        ]);

        return redirect()->route('superadmin.users')->with('success', 'User created successfully');
    }

    /**
     * Show the database configuration page.
     */
    public function databaseSettings(): Response
    {
        // Get basic database connection info
        $connection = config('database.default');
        $config = config('database.connections.' . $connection);
        
        // Remove sensitive info
        if (isset($config['password'])) {
            $config['password'] = '********';
        }

        try {
            // Get table stats
            if ($connection === 'sqlite') {
                $tables = DB::select('SELECT name FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%"');
            } else {
                $tables = DB::select('SHOW TABLES');
            }
            
            $tableStats = [];
            
            foreach ($tables as $table) {
                $tableName = $connection === 'sqlite' ? $table->name : $table->{array_key_first((array)$table)};
                $count = DB::table($tableName)->count();
                $tableStats[$tableName] = [
                    'count' => $count,
                    'last_updated' => null, // This would require specific tracking in your app
                ];
            }
        } catch (\Exception $e) {
            // Handle any database connection issues
            $tableStats = [];
        }

        return Inertia::render('superadmin/system/database', [
            'connection' => $connection,
            'config' => $config,
            'tableStats' => $tableStats
        ]);
    }

    /**
     * Show the environment configuration page.
     */
    public function envSettings(): Response
    {
        // Get safe environment variables
        $safeEnvVars = [
            'APP_NAME' => env('APP_NAME'),
            'APP_ENV' => env('APP_ENV'),
            'APP_DEBUG' => env('APP_DEBUG'),
            'APP_URL' => env('APP_URL'),
            'DB_CONNECTION' => env('DB_CONNECTION'),
            'CACHE_DRIVER' => env('CACHE_DRIVER'),
            'QUEUE_CONNECTION' => env('QUEUE_CONNECTION'),
            'SESSION_DRIVER' => env('SESSION_DRIVER'),
            'SESSION_LIFETIME' => env('SESSION_LIFETIME'),
            'MAIL_MAILER' => env('MAIL_MAILER'),
            'MAIL_HOST' => env('MAIL_HOST'),
        ];

        return Inertia::render('superadmin/system/env', [
            'envVars' => $safeEnvVars
        ]);
    }

    /**
     * Show the permissions page.
     */
    public function permissions(): Response
    {
        // Define available permissions by role
        $rolePermissions = [
            'admin' => [
                'view_public_dashboard' => true,
                'view_personal_settings' => true,
                'view_admin_dashboard' => true,
                'manage_sensors' => true,
                'manage_alerts' => true,
                'view_reports' => true,
            ],
            'super_admin' => [
                'view_public_dashboard' => true,
                'view_personal_settings' => true, 
                'view_admin_dashboard' => true,
                'manage_sensors' => true,
                'manage_alerts' => true,
                'view_reports' => true,
                'manage_users' => true,
                'manage_system_config' => true,
                'manage_security' => true,
            ],
        ];

        return Inertia::render('superadmin/security/permissions', [
            'rolePermissions' => $rolePermissions
        ]);
    }

    /**
     * Show the security settings page.
     */
    public function securitySettings(): Response
    {
        // Get security settings from database
        $sessionLifetime = SystemSetting::getByKey('session.lifetime', config('session.lifetime'));
        $sessionExpireOnClose = SystemSetting::getByKey('session.expire_on_close', config('session.expire_on_close'));
        $sessionSameSite = SystemSetting::getByKey('session.same_site', config('session.same_site'));

        // Get security settings
        $securitySettings = [
            'session' => [
                'lifetime' => $sessionLifetime,
                'expire_on_close' => $sessionExpireOnClose,
                'secure' => config('session.secure'),
                'http_only' => config('session.http_only'),
                'same_site' => $sessionSameSite,
            ],
            'auth' => [
                'password_timeout' => config('auth.password_timeout', 10800),
                'password_reset_expiry' => config('auth.passwords.users.expire', 60),
            ],
        ];

        return Inertia::render('superadmin/security/settings', [
            'securitySettings' => $securitySettings,
            'success' => session('success'),
            'error' => session('error')
        ]);
    }

    /**
     * Update security settings
     */
    public function updateSecuritySettings(Request $request)
    {
        $request->validate([
            'session.lifetime' => 'required|integer|min:1|max:1440',
            'session.expire_on_close' => 'required|boolean',
            'session.same_site' => 'required|in:lax,strict,none',
        ]);

        try {
            DB::beginTransaction();

            // Update settings in the database
            SystemSetting::set('session.lifetime', $request->input('session.lifetime'), 'security', 'integer', 'Session lifetime in minutes');
            SystemSetting::set('session.expire_on_close', $request->input('session.expire_on_close'), 'security', 'boolean', 'Whether sessions should expire when the browser is closed');
            SystemSetting::set('session.same_site', $request->input('session.same_site'), 'security', 'string', 'SameSite cookie attribute');

            // Update runtime config as well
            config(['session.lifetime' => $request->input('session.lifetime')]);
            config(['session.expire_on_close' => $request->input('session.expire_on_close')]);
            config(['session.same_site' => $request->input('session.same_site')]);
            
            DB::commit();
            
            // Log the change for audit purposes
            \Log::info('Security settings updated by super admin: ' . auth()->user()->name, [
                'session' => $request->input('session')
            ]);
            
            return redirect()->route('superadmin.security.settings')
                ->with('success', 'Security settings updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->route('superadmin.security.settings')
                ->with('error', 'Failed to update security settings: ' . $e->getMessage());
        }
    }

    /**
     * Delete a user
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return redirect()->route('superadmin.users')
                ->with('error', 'You cannot delete your own account.');
        }

        // Prevent deleting other super admins
        if ($user->role === 'super_admin') {
            return redirect()->route('superadmin.users')
                ->with('error', 'You cannot delete other super admin accounts.');
        }

        try {
            $userName = $user->name;
            $user->delete();
            
            // Log the deletion for audit purposes
            \Log::info('User deleted by super admin: ' . auth()->user()->name, [
                'deleted_user' => $userName,
                'deleted_user_id' => $id
            ]);
            
            return redirect()->route('superadmin.users')
                ->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->route('superadmin.users')
                ->with('error', 'Failed to delete user: ' . $e->getMessage());
        }
    }
}
