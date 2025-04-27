<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sensor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'latitude',
        'longitude',
        'status',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    protected $with = ['lastReading'];

    /**
     * Get all readings for this sensor.
     */
    public function readings(): HasMany
    {
        return $this->hasMany(Reading::class);
    }

    /**
     * Get the latest reading for this sensor.
     */
    public function lastReading()
    {
        return $this->hasOne(Reading::class)->latest('timestamp');
    }

    /**
     * Format the sensor data for use in the frontend.
     */
    public function toArray(): array
    {
        $data = parent::toArray();

        // Format the location data to match the frontend structure
        $data['location'] = [
            'lat' => $this->latitude,
            'lng' => $this->longitude,
            'address' => $this->location,
        ];

        // Remove the individual location fields
        unset($data['latitude'], $data['longitude'], $data['location']);

        return $data;
    }
}
