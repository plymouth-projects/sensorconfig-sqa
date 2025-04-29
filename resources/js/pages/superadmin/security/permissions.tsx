import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Shield, User, UserCog } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

interface PermissionsProps {
    rolePermissions: Record<string, Record<string, boolean>>;
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
        title: 'Role Permissions',
        href: '/admin/super/security/permissions',
    },
];

export default function Permissions({ rolePermissions }: PermissionsProps) {
    // Extract all unique permission keys
    const allPermissions = Object.values(rolePermissions).reduce((acc, permissions) => {
        Object.keys(permissions).forEach(perm => {
            if (!acc.includes(perm)) {
                acc.push(perm);
            }
        });
        return acc;
    }, [] as string[]);

    // Get user-friendly names for permissions
    const getPermissionLabel = (permission: string): string => {
        const labels: Record<string, string> = {
            'view_public_dashboard': 'View Public Dashboard',
            'view_personal_settings': 'View Personal Settings',
            'view_admin_dashboard': 'View Admin Dashboard',
            'manage_sensors': 'Manage Sensors',
            'manage_alerts': 'Manage Alerts',
            'view_reports': 'View Reports',
            'manage_users': 'Manage Users',
            'manage_system_config': 'Manage System Config',
            'manage_security': 'Manage Security',
        };
        return labels[permission] || permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Get icon for role
    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'super_admin':
                return <Shield className="h-4 w-4" />;
            case 'admin':
                return <UserCog className="h-4 w-4" />;
            default:
                return <User className="h-4 w-4" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Permissions" />
            <div className="space-y-6 p-8">
                <div className="flex items-center space-x-2">
                    <Lock className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold tracking-tight">Role Permissions</h2>
                </div>
                <p className="text-muted-foreground">
                    View the permissions assigned to each role in the system. These permissions control what features and actions are available to users.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>Permission Matrix</CardTitle>
                        <CardDescription>Shows which features are accessible by each role</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Permission</TableHead>
                                        {Object.keys(rolePermissions).map((role) => (
                                            <TableHead key={role} className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center gap-1">
                                                        {getRoleIcon(role)}
                                                        <span className="capitalize">{role.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allPermissions.map((permission) => (
                                        <TableRow key={permission}>
                                            <TableCell className="font-medium">
                                                {getPermissionLabel(permission)}
                                            </TableCell>
                                            {Object.entries(rolePermissions).map(([role, permissions]) => (
                                                <TableCell key={role} className="text-center">
                                                    <div className="flex justify-center">
                                                        <Checkbox 
                                                            checked={permissions[permission] || false} 
                                                            disabled={true}
                                                            className="data-[state=checked]:bg-primary"
                                                        />
                                                    </div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Note: Permission changes for roles need to be made at the code level as they determine core application behavior.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Role Descriptions</CardTitle>
                        <CardDescription>Explanation of each role in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
                                    <Shield className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Super Admin</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Super Administrators have complete control over the entire system, including user management, 
                                        system configuration, and security settings. This role should be limited to very few trusted individuals.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-800">
                                    <UserCog className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Admin</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Administrators (Monitoring Admins) can manage sensors, alerts, and view reports. They have access to the 
                                        admin dashboard but cannot manage users or modify system configuration.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 rounded-full bg-neutral-100 p-2 text-neutral-800">
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-medium">User</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Regular users can view the public dashboard and manage their personal settings, 
                                        but do not have access to administrative features.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}