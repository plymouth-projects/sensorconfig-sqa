import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Server } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface DatabaseSettingsProps {
    connection: string;
    config: Record<string, any>;
    tableStats: Record<string, { count: number; last_updated: string | null }>;
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
        title: 'Database Settings',
        href: '/admin/super/system/database',
    },
];

export default function DatabaseSettings({ connection, config, tableStats }: DatabaseSettingsProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Database Settings" />
            <div className="space-y-6 p-8">
                <div className="flex items-center space-x-2">
                    <Database className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold tracking-tight">Database Settings</h2>
                </div>
                <p className="text-muted-foreground">
                    View and manage database configuration. Changes to database settings should be made with caution as they can affect system stability.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Database Connection</CardTitle>
                            <CardDescription>Current database connection configuration</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium">Connection Type</h3>
                                    <p className="text-muted-foreground">{connection}</p>
                                </div>
                                <div>
                                    <h3 className="font-medium">Database Details</h3>
                                    <div className="mt-2 space-y-2">
                                        {Object.entries(config).map(([key, value]) => (
                                            <div key={key} className="grid grid-cols-3">
                                                <span className="col-span-1 font-mono text-sm">{key}</span>
                                                <span className="col-span-2 text-sm text-muted-foreground">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Server Information</CardTitle>
                            <CardDescription>Database server status and configuration</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">Server Status</h3>
                                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                        Connected
                                    </span>
                                </div>

                                <div>
                                    <h3 className="font-medium">Server Info</h3>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Server Type</span>
                                            <span className="font-medium">{connection === 'sqlite' ? 'SQLite' : connection}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Version</span>
                                            <span className="font-medium">--</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Character Set</span>
                                            <span className="font-medium">{config.charset || 'UTF-8'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-muted-foreground">Storage Engine</span>
                                            <span className="font-medium">{connection}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">Database Size</h3>
                                    <span className="font-mono text-sm">--</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Table Information</CardTitle>
                        <CardDescription>Overview of tables in the database</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableCaption>A list of tables in the database</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Table Name</TableHead>
                                        <TableHead>Row Count</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.entries(tableStats).map(([tableName, stats]) => (
                                        <TableRow key={tableName}>
                                            <TableCell className="font-medium">{tableName}</TableCell>
                                            <TableCell>{stats.count}</TableCell>
                                            <TableCell>{stats.last_updated || '--'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}