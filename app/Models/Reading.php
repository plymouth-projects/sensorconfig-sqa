<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reading extends Model
{
    use HasFactory;
    
    protected $fillable = ['sensor_id', 'timestamp', 'aqi', 'pm25', 'pm10'];
    
    protected $casts = [
        'timestamp' => 'datetime',
        'aqi' => 'float',
        'pm25' => 'float',
        'pm10' => 'float'
    ];
    
    public function sensor(): BelongsTo
    {
        return $this->belongsTo(Sensor::class);
    }
} 