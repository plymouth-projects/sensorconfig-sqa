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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value');
            $table->string('group')->nullable();
            $table->string('type')->default('string');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default security settings
        DB::table('system_settings')->insert([
            [
                'key' => 'session.lifetime',
                'value' => '120',
                'group' => 'security',
                'type' => 'integer',
                'description' => 'Session lifetime in minutes',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'session.expire_on_close',
                'value' => 'false',
                'group' => 'security',
                'type' => 'boolean',
                'description' => 'Whether sessions should expire when the browser is closed',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'session.same_site',
                'value' => 'lax',
                'group' => 'security',
                'type' => 'string',
                'description' => 'SameSite cookie attribute',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};