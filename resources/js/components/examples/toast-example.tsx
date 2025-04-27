import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function ToastExample() {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Toast Examples</h2>
      
      <div className="flex space-x-4">
        <Button 
          onClick={() => {
            toast({
              title: 'Default Toast',
              description: 'This is a default toast notification',
            });
          }}
        >
          Show Default Toast
        </Button>
        
        <Button 
          onClick={() => {
            toast({
              title: 'Success',
              description: 'Operation completed successfully',
              variant: 'success',
            });
          }}
          variant="outline"
        >
          Show Success Toast
        </Button>
        
        <Button 
          onClick={() => {
            toast({
              title: 'Error',
              description: 'Something went wrong',
              variant: 'destructive',
            });
          }}
          variant="destructive"
        >
          Show Error Toast
        </Button>
        
        <Button 
          onClick={() => {
            toast({
              title: 'With Action',
              description: 'This toast has an action button',
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo clicked'),
              },
            });
          }}
          variant="secondary"
        >
          Toast With Action
        </Button>
      </div>
    </div>
  );
} 