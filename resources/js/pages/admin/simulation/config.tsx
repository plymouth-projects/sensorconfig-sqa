import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Activity, Save, Plus, Trash, Play, Square } from 'lucide-react';
import { SimulationService } from '@/services/SimulationService';
import type { SimulationConfig, SimulationPattern } from '@/types/sensor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
  },
  {
    title: 'Simulation',
    href: '/admin/simulation/config',
  }
];

export default function SimulationConfig() {
  const [config, setConfig] = useState<SimulationConfig>({
    id: 1,
    isActive: false,
    frequency: 60,
    baselineAqi: 50,
    variationRange: {
      min: 10,
      max: 30
    },
    patterns: [],
    lastUpdated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<'running' | 'stopped'>('stopped');
  const [patternDialog, setPatternDialog] = useState<{
    open: boolean;
    type: string;
    intensity?: number;
    morningPeak?: number;
    eveningPeak?: number;
    rainEffect?: number;
    windEffect?: number;
  }>({
    open: false,
    type: 'random'
  });
  
  // Alert state
  const [alertState, setAlertState] = useState<{
    open: boolean;
    title: string;
    description: string;
  }>({
    open: false,
    title: '',
    description: ''
  });

  useEffect(() => {
    loadConfig();
    loadStatus();
  }, []);

  const showAlert = (title: string, description: string) => {
    setAlertState({
      open: true,
      title,
      description
    });
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await SimulationService.getSimulationConfig();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load simulation config:', error);
      showAlert('Error', 'Failed to load simulation configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const status = await SimulationService.getStatus();
      setSimulationStatus(status.status);
    } catch (error) {
      console.error('Failed to load simulation status:', error);
    }
  };

  const handleBaselineChange = (value: number[]) => {
    setConfig(prev => ({
      ...prev,
      baselineAqi: value[0]
    }));
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setConfig(prev => ({
        ...prev,
        frequency: value
      }));
    }
  };

  const handleVariationRangeChange = (values: number[]) => {
    setConfig(prev => ({
      ...prev,
      variationRange: {
        min: values[0],
        max: values[1]
      }
    }));
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      
      // Create a complete configuration object to ensure all data is saved to the database
      const configToSave = {
        isActive: config.isActive,
        frequency: config.frequency,
        baselineAqi: config.baselineAqi,
        variationRange: config.variationRange,
        patterns: config.patterns
      };
      
      // Send the complete configuration to the database
      const updatedConfig = await SimulationService.updateSimulationConfig(configToSave);
      
      // Update local state with the response from the server
      setConfig(updatedConfig);
      
      showAlert('Success', 'Simulation configuration saved successfully');
    } catch (error) {
      console.error('Failed to save simulation config:', error);
      showAlert('Error', 'Failed to save simulation configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleStartSimulation = async () => {
    try {
      const response = await SimulationService.startSimulation();
      
      // Explicitly set the simulation status when the start button is clicked
      setSimulationStatus('running');
      
      showAlert('Simulation Started', response.message);
      
      // Force refresh status after a brief delay to ensure server state is updated
      setTimeout(() => {
        loadStatus();
      }, 500);
    } catch (error) {
      console.error('Failed to start simulation:', error);
      showAlert('Error', 'Failed to start simulation');
    }
  };

  const handleStopSimulation = async () => {
    try {
      const response = await SimulationService.stopSimulation();
      
      // Explicitly set the simulation status to stopped when the stop button is clicked
      setSimulationStatus('stopped');
      
      showAlert('Simulation Stopped', response.message);
      
      // Don't check the status again after stopping - rely on our explicit state
      // This ensures the simulation stays stopped until user explicitly starts it again
    } catch (error) {
      console.error('Failed to stop simulation:', error);
      showAlert('Error', 'Failed to stop simulation');
    }
  };

  const handleAddPattern = async () => {
    try {
      let newPattern: SimulationPattern;
      
      if (patternDialog.type === 'random' && patternDialog.intensity !== undefined) {
        newPattern = {
          type: 'random',
          intensity: patternDialog.intensity
        };
      } else if (patternDialog.type === 'time-based' && 
                patternDialog.morningPeak !== undefined && 
                patternDialog.eveningPeak !== undefined) {
        newPattern = {
          type: 'time-based',
          morningPeak: patternDialog.morningPeak,
          eveningPeak: patternDialog.eveningPeak
        };
      } else if (patternDialog.type === 'weather-based' && 
                patternDialog.rainEffect !== undefined && 
                patternDialog.windEffect !== undefined) {
        newPattern = {
          type: 'weather-based',
          rainEffect: patternDialog.rainEffect,
          windEffect: patternDialog.windEffect
        };
      } else {
        showAlert('Validation Error', 'Please fill all required fields for the pattern');
        return;
      }
      
      // Add pattern to local state first
      setConfig(prev => ({
        ...prev,
        patterns: [...prev.patterns, newPattern]
      }));
      
      // Then save to backend
      await SimulationService.addPattern(newPattern);
      
      setPatternDialog({
        open: false,
        type: 'random'
      });
      
      showAlert('Success', 'Simulation pattern added successfully');
    } catch (error) {
      console.error('Failed to add pattern:', error);
      showAlert('Error', 'Failed to add simulation pattern');
    }
  };

  const handleRemovePattern = async (index: number) => {
    try {
      const patternToRemove = config.patterns[index];
      
      // Remove from local state first
      setConfig(prev => ({
        ...prev,
        patterns: prev.patterns.filter((_, i) => i !== index)
      }));
      
      // Then update in backend
      await SimulationService.removePattern(patternToRemove.type);
      
      showAlert('Success', 'Simulation pattern removed successfully');
    } catch (error) {
      console.error('Failed to remove pattern:', error);
      showAlert('Error', 'Failed to remove simulation pattern');
      
      // Revert the state change since the API call failed
      loadConfig();
    }
  };

  const renderPatternForm = () => {
    switch (patternDialog.type) {
      case 'random':
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="intensity">Random Intensity</Label>
              <div className="space-y-4">
                <Slider
                  id="intensity"
                  min={1}
                  max={10}
                  step={1}
                  value={[patternDialog.intensity || 5]}
                  onValueChange={(values: number[]) => setPatternDialog(prev => ({...prev, intensity: values[0]}))}
                />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low</span>
                  <span className="text-sm font-medium">{patternDialog.intensity || 5}</span>
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'time-based':
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="morningPeak">Morning Peak Increase (%)</Label>
              <Input
                id="morningPeak"
                type="number"
                min={0}
                max={100}
                value={patternDialog.morningPeak || 20}
                onChange={(e) => setPatternDialog(prev => ({...prev, morningPeak: parseInt(e.target.value)}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eveningPeak">Evening Peak Increase (%)</Label>
              <Input
                id="eveningPeak"
                type="number"
                min={0}
                max={100}
                value={patternDialog.eveningPeak || 30}
                onChange={(e) => setPatternDialog(prev => ({...prev, eveningPeak: parseInt(e.target.value)}))}
              />
            </div>
          </div>
        );
      case 'weather-based':
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rainEffect">Rain Effect (%)</Label>
              <Input
                id="rainEffect"
                type="number"
                min={-50}
                max={50}
                value={patternDialog.rainEffect || -20}
                onChange={(e) => setPatternDialog(prev => ({...prev, rainEffect: parseInt(e.target.value)}))}
              />
              <p className="text-sm text-muted-foreground">Negative values reduce AQI (improve air quality)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="windEffect">Wind Effect (%)</Label>
              <Input
                id="windEffect"
                type="number"
                min={-50}
                max={50}
                value={patternDialog.windEffect || -30}
                onChange={(e) => setPatternDialog(prev => ({...prev, windEffect: parseInt(e.target.value)}))}
              />
              <p className="text-sm text-muted-foreground">Negative values reduce AQI (improve air quality)</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const formatPatternDetails = (pattern: SimulationPattern) => {
    switch (pattern.type) {
      case 'random':
        return `Random variation with intensity level ${pattern.intensity}`;
      case 'time-based':
        return `Time-based with morning peak +${pattern.morningPeak}% and evening peak +${pattern.eveningPeak}%`;
      case 'weather-based':
        return `Weather effects: Rain ${pattern.rainEffect > 0 ? '+' : ''}${pattern.rainEffect}%, Wind ${pattern.windEffect > 0 ? '+' : ''}${pattern.windEffect}%`;
      default:
        return 'Unknown pattern';
    }
  };

  if (loading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Simulation Configuration" />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Simulation Configuration" />
      
      {/* Alert Dialog */}
      <AlertDialog open={alertState.open} onOpenChange={(open) => setAlertState(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertState.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Simulation Configuration</h2>
          </div>
          <div className="flex space-x-2">
            {simulationStatus === 'running' ? (
              <Button variant="destructive" onClick={handleStopSimulation}>
                <Square className="mr-2 h-4 w-4" /> Stop Simulation
              </Button>
            ) : (
              <Button variant="default" onClick={handleStartSimulation}>
                <Play className="mr-2 h-4 w-4" /> Start Simulation
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
              <CardDescription>Configure the core simulation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="simulation-status">Simulation Status</Label>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${simulationStatus === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className="text-sm font-medium">
                    {simulationStatus === 'running' ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="frequency">Data Generation Frequency</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.frequency} seconds
                  </span>
                </div>
                <Input
                  id="frequency"
                  type="number"
                  min={5}
                  max={3600}
                  value={config.frequency}
                  onChange={handleFrequencyChange}
                />
                <p className="text-xs text-muted-foreground">
                  How often new data points are generated (in seconds)
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="baseline">Baseline AQI</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.baselineAqi} AQI
                  </span>
                </div>
                <Slider
                  id="baseline"
                  min={0}
                  max={300}
                  step={1}
                  value={[config.baselineAqi]}
                  onValueChange={handleBaselineChange}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Good (0)</span>
                  <span>Moderate (50)</span>
                  <span>Unhealthy (150)</span>
                  <span>Hazardous (300)</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="variation">Variation Range</Label>
                  <span className="text-sm text-muted-foreground">
                    ±{config.variationRange.min} to ±{config.variationRange.max}
                  </span>
                </div>
                <Slider
                  id="variation"
                  min={0}
                  max={100}
                  step={1}
                  value={[config.variationRange.min, config.variationRange.max]}
                  onValueChange={handleVariationRangeChange}
                />
                <p className="text-xs text-muted-foreground">
                  Random variation applied to the baseline AQI value
                </p>
              </div>
              
              <Button 
                onClick={handleSaveConfig} 
                className="w-full"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Configuration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Simulation Patterns</CardTitle>
                  <CardDescription>Add variation patterns to make data more realistic</CardDescription>
                </div>
                <Dialog
                  open={patternDialog.open}
                  onOpenChange={(open) => setPatternDialog(prev => ({ ...prev, open }))}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setPatternDialog({ open: true, type: 'random', intensity: 5 })}>
                      <Plus className="mr-2 h-4 w-4" /> Add Pattern
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Simulation Pattern</DialogTitle>
                      <DialogDescription>
                        Create a new pattern to add more realism to your simulated data
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="pattern-type">Pattern Type</Label>
                        <Select 
                          value={patternDialog.type} 
                          onValueChange={(value) => setPatternDialog(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select pattern type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="random">Random Variation</SelectItem>
                            <SelectItem value="time-based">Time-based Pattern</SelectItem>
                            <SelectItem value="weather-based">Weather-based Effects</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {renderPatternForm()}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPatternDialog(prev => ({ ...prev, open: false }))}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddPattern}>Add Pattern</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.patterns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">No patterns configured</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add patterns to create more realistic air quality data
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {config.patterns.map((pattern, index) => (
                      <div 
                        key={`${pattern.type}-${index}`}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="font-medium">
                            {pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)} Pattern
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPatternDetails(pattern)}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemovePattern(index)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-3">
              <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                <div>Last updated: {new Date(config.lastUpdated).toLocaleString()}</div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}