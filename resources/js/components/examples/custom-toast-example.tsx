import React from 'react';
import { useToast } from '@/contexts/custom-toast-context';
import { Button } from '@/components/ui/button';

export function CustomToastExample() {
  const { toast, dismissAll } = useToast();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Custom Toast Examples</h2>
      
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={() => {
            toast({
              title: 'Default Notification',
              description: 'This is a default notification using our custom toast system',
            });
          }}
        >
          Default Toast
        </Button>
        
        <Button 
          onClick={() => {
            toast({
              title: 'Success!',
              description: 'Operation completed successfully',
              variant: 'success',
            });
          }}
          variant="outline"
          className="border-green-500 text-green-600 hover:bg-green-50"
        >
          Success Toast
        </Button>
        
        <Button 
          onClick={() => {
            toast({
              title: 'Error!',
              description: 'Something went wrong while processing your request',
              variant: 'destructive',
              duration: 8000,
            });
          }}
          variant="destructive"
        >
          Error Toast
        </Button>
        
        <Button 
          onClick={() => {
            toast({
              title: 'Information',
              description: 'This toast provides useful information to the user',
              variant: 'info',
            });
          }}
          variant="outline"
          className="border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          Info Toast
        </Button>
        
        <Button 
          onClick={() => {
            toast({
              title: 'Action Required',
              description: 'Please take action on this notification',
              action: {
                label: 'Perform Action',
                onClick: () => {
                  alert('Action performed!');
                },
              },
            });
          }}
          variant="secondary"
        >
          Toast With Action
        </Button>
        
        <Button 
          onClick={dismissAll}
          variant="outline"
          className="border-gray-500"
        >
          Dismiss All
        </Button>
      </div>
    </div>
  );
} 