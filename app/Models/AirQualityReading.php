<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AirQualityReading extends Model
{
    protected $fillable = [
        'sensor_id',
        'timestamp',
        'aqi',
        'pm25',
        'pm10',
        'o3',
        'no2',
        'so2',
        'co',
        'temperature',
        'humidity',
        'wind_speed',
        'wind_direction',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'aqi' => 'float',
        'pm25' => 'float',
        'pm10' => 'float',
        'o3' => 'float',
        'no2' => 'float',
        'so2' => 'float',
        'co' => 'float',
        'temperature' => 'float',
        'humidity' => 'float',
        'wind_speed' => 'float',
        'wind_direction' => 'string',
    ];

    /**
     * Get the sensor that owns the reading.
     */
    public function sensor(): BelongsTo
    {
        return $this->belongsTo(Sensor::class);
    }
}
