<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SimulationConfig;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class RefreshSimulationSettings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'simulation:refresh-settings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Refresh simulation settings to apply frequency changes immediately';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // For now, we just log that this command was called
        // In a production environment, you might need to restart the scheduler
        // or make other system changes to immediately apply the new frequency
        
        $config = SimulationConfig::first();
        if (!$config) {
            $this->error('No simulation configuration found');
            Log::error('RefreshSimulationSettings: No simulation configuration found');
            return Command::FAILURE;
        }
        
        $frequency = $config->frequency;
        $this->info("Refreshing simulation settings with frequency: {$frequency} seconds");
        Log::info("RefreshSimulationSettings: Refreshed simulation with frequency: {$frequency} seconds");
        
        // Call the generate-readings command immediately to align with the new frequency
        if (\App\Services\SimulationService::isRunning()) {
            $this->info('Simulation is running, generating readings now...');
            Artisan::call('simulation:generate-readings');
            $this->info(Artisan::output());
        }
        
        return Command::SUCCESS;
    }
}
