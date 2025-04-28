<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SimulationService;
use Illuminate\Support\Facades\Log;

class GenerateReadings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'simulation:generate-readings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate new sensor readings if simulation is running';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Only generate readings if simulation is running
        if (SimulationService::isRunning()) {
            $count = SimulationService::generateReadings();
            Log::info("Command executed: Generated $count sensor readings");
            $this->info("Generated $count sensor readings");
        } else {
            Log::info("Command executed: Simulation is not running, no readings generated");
            $this->info("Simulation is not running, no readings generated");
        }
        
        return Command::SUCCESS;
    }
} 