<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'description',
    ];

    /**
     * Cast the value based on its type
     *
     * @param mixed $value
     * @return mixed
     */
    public function getTypedValue()
    {
        switch ($this->type) {
            case 'boolean':
                return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
            case 'integer':
                return (int) $this->value;
            case 'float':
                return (float) $this->value;
            case 'array':
                return json_decode($this->value, true);
            case 'object':
                return json_decode($this->value);
            default:
                return $this->value;
        }
    }

    /**
     * Get a setting by key
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getByKey(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }
        
        return $setting->getTypedValue();
    }

    /**
     * Set a setting value
     *
     * @param string $key
     * @param mixed $value
     * @param string|null $group
     * @param string $type
     * @param string|null $description
     * @return SystemSetting
     */
    public static function set(string $key, $value, ?string $group = null, string $type = 'string', ?string $description = null)
    {
        // Prepare the value based on type
        if ($type === 'array' || $type === 'object') {
            $value = json_encode($value);
        } elseif ($type === 'boolean') {
            $value = $value ? 'true' : 'false';
        } else {
            $value = (string) $value;
        }

        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'group' => $group,
                'type' => $type,
                'description' => $description,
            ]
        );
    }
}