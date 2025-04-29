import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Shield, Users, Settings, ServerCog, Lock } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';

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
        href: '/superadmin/dashboard',
    },
];

export default function SuperAdminDashboard({ role }: SuperAdminProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Super Admin Dashboard" />
            <div className="space-y-6 p-8">
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
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                User Management
                            </CardTitle>
                            <CardDescription>Manage all user accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>You can manage all users, including admin accounts.</p>
                        </CardContent>
                        <CardFooter>
                            <div className="flex flex-col space-y-2 w-full">
                                <Button asChild variant="outline" className="w-full justify-start">
                                    <Link href={route('superadmin.users')}>
                                        User List
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full justify-start">
                                    <Link href={route('superadmin.users.create')}>
                                        Create Admin
                                    </Link>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ServerCog className="h-5 w-5" />
                                System Configuration
                            </CardTitle>
                            <CardDescription>System-wide settings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Configure system-wide settings and application parameters.</p>
                        </CardContent>
                        <CardFooter>
                            <div className="flex flex-col space-y-2 w-full">
                                <Button asChild variant="outline" className="w-full justify-start">
                                    <Link href={route('superadmin.system.database')}>
                                        Database Settings
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full justify-start">
                                    <Link href={route('superadmin.system.env')}>
                                        Environment Configuration
                                    </Link>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Security Setup
                            </CardTitle>
                            <CardDescription>Manage admin accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Configure security settings and manage access permissions.</p>
                        </CardContent>
                        <CardFooter>
                            <div className="flex flex-col space-y-2 w-full">
                                <Button asChild variant="outline" className="w-full justify-start">
                                    <Link href={route('superadmin.security.permissions')}>
                                        Role Permissions
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full justify-start">
                                    <Link href={route('superadmin.security.settings')}>
                                        Security Settings
                                    </Link>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Your Role
                            </CardTitle>
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