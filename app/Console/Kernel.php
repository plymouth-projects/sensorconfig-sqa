<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\SimulationConfig;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Get the simulation frequency from the database
        $config = SimulationConfig::first();
        $frequency = $config ? $config->frequency : 30; // Default to 30 seconds if no config

        // Calculate minutes based on frequency (in seconds)
        $minutes = max(1, intval($frequency / 60));
        
        // Generate new sensor readings based on the configured frequency
        if ($minutes == 1) {
            $schedule->command('simulation:generate-readings')
                    ->everyMinute()
                    ->withoutOverlapping()
                    ->appendOutputTo(storage_path('logs/readings.log'));
        } else {
            $schedule->command('simulation:generate-readings')
                    ->cron("*/{$minutes} * * * *") // Run every X minutes
                    ->withoutOverlapping()
                    ->appendOutputTo(storage_path('logs/readings.log'));
        }
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}