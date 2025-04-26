import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface SuperAdminProps {
    role: string;
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
];

export default function SuperAdminDashboard({ role }: SuperAdminProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Super Admin Dashboard" />
            <div className="space-y-6">
                <div className="flex items-center space-x-2">
                    <Shield className="h-8 w-8 text-destructive" />
                    <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
                </div>
                <p className="text-muted-foreground">
                    Welcome to the super admin dashboard. You have access to all features because you've used the super admin key.
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage all user accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>You can manage all users, including admin accounts.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>System Configuration</CardTitle>
                            <CardDescription>System-wide settings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Configure system-wide settings and application parameters.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Management</CardTitle>
                            <CardDescription>Manage admin accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>You can manage regular admin accounts and their permissions.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Role</CardTitle>
                            <CardDescription>Current permission level</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-2 bg-destructive/10 rounded-md text-destructive font-medium">
                                Super Admin
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 