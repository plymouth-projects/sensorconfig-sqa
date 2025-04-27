import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface AdminProps {
    role: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    }
];

export default function AdminDashboard({ role }: AdminProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="space-y-6">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                </div>
                <p className="text-muted-foreground">
                    Welcome to the admin dashboard. You have access to admin features because you've used the admin key.
                </p>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage user accounts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>You can manage regular user accounts, reset passwords, and more from here.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Content Management</CardTitle>
                            <CardDescription>Manage site content</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Edit site content, add news or announcements, and manage pages.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Role</CardTitle>
                            <CardDescription>Current permission level</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-2 bg-primary/10 rounded-md text-primary font-medium">
                                Admin
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 