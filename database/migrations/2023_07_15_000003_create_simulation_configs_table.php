<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('simulation_configs', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_active')->default(false);
            $table->integer('frequency')->default(30); // minutes
            $table->decimal('baseline_aqi', 8, 2)->default(50);
            $table->json('variation_range')->nullable(); // Can't use default for JSON in MySQL
            $table->json('patterns')->nullable();
            $table->timestamp('last_updated')->useCurrent();
            $table->timestamps();
        });
        
        // Insert default config with the variation range
        DB::table('simulation_configs')->insert([
            'is_active' => false,
            'frequency' => 30,
            'baseline_aqi' => 50,
            'variation_range' => json_encode(['min' => 10, 'max' => 30]),
            'last_updated' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simulation_configs');
    }
}; 