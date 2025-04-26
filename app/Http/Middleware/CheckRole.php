<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Check if user is logged in
        if (!$request->user()) {
            return redirect()->route('login');
        }

        // If no specific roles are required, continue
        if (empty($roles)) {
            return $next($request);
        }

        // Check if user has one of the required roles
        if (in_array($request->user()->role, $roles)) {
            return $next($request);
        }

        // If the user doesn't have the required role, redirect to dashboard with error
        return redirect()->route('dashboard')->with('error', 'You do not have permission to access this page.');
    }
}
