<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
}
