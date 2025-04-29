import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface EnvSettingsProps {
    envVars: Record<string, any>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Super Admin',
        href: '/admin/super',
    },
    {
        title: 'Environment Configuration',
        href: '/admin/super/system/env',
    },
];

export default function EnvSettings({ envVars }: EnvSettingsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Environment Configuration" />
            <div className="space-y-6 p-8">
                <div className="flex items-center space-x-2">
                    <Settings className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold tracking-tight">Environment Configuration</h2>
                </div>
                <p className="text-muted-foreground">
                    View environment variables and configuration. This page only shows non-sensitive variables for security reasons.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>Environment Variables</CardTitle>
                        <CardDescription>Important configuration values for the application</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Variable</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(envVars).map(([key, value]) => (
                                        <TableRow key={key}>
                                            <TableCell className="font-mono text-sm">{key}</TableCell>
                                            <TableCell>{String(value)}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {getEnvDescription(key)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Note: To modify these values, edit the .env file in the server root directory. After changing values, 
                            the application may need to be restarted for changes to take effect.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Application Information</CardTitle>
                        <CardDescription>General information about the application environment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="font-medium">Application Name</h3>
                                <p className="text-muted-foreground">{envVars.APP_NAME || 'Laravel'}</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium">Environment</h3>
                                <p className="text-muted-foreground">{envVars.APP_ENV || 'local'}</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium">Debug Mode</h3>
                                <p className="text-muted-foreground">{envVars.APP_DEBUG ? 'Enabled' : 'Disabled'}</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium">Application URL</h3>
                                <p className="text-muted-foreground">{envVars.APP_URL || 'http://localhost'}</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium">Session Lifetime</h3>
                                <p className="text-muted-foreground">{envVars.SESSION_LIFETIME || '120'} minutes</p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium">Cache Driver</h3>
                                <p className="text-muted-foreground">{envVars.CACHE_DRIVER || 'file'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function getEnvDescription(key: string): string {
    const descriptions: Record<string, string> = {
        'APP_NAME': 'The name of your application',
        'APP_ENV': 'The environment the application is running in',
        'APP_DEBUG': 'Whether debugging is enabled',
        'APP_URL': 'The base URL of your application',
        'DB_CONNECTION': 'The database driver that will be used',
        'CACHE_DRIVER': 'The cache driver to be used',
        'QUEUE_CONNECTION': 'The queue connection to be used',
        'SESSION_DRIVER': 'The session driver to be used',
        'SESSION_LIFETIME': 'Number of minutes that sessions should be valid',
        'MAIL_MAILER': 'The mail driver to be used',
        'MAIL_HOST': 'The SMTP host address',
    };

    return descriptions[key] || 'Configuration variable for the application';
}