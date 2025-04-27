<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SimulationConfig extends Model
{
    use HasFactory;
    
    protected $fillable = ['is_active', 'frequency', 'baseline_aqi', 'variation_range', 'patterns', 'last_updated'];
    
    protected $casts = [
        'is_active' => 'boolean',
        'variation_range' => 'array',
        'patterns' => 'array',
        'last_updated' => 'datetime'
    ];
} 