import { Head, Link } from '@inertiajs/react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, UserCog, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SuperAdminService } from '@/services/SuperAdminService';
import { UserWithRole } from '@/types/admin';

interface UsersPageProps {
    success?: string;
    error?: string;
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
    {
        title: 'User Management',
        href: '/superadmin/users',
    },
];

export default function UsersIndex({ success, error }: UsersPageProps) {
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState<'success' | 'error'>('success');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (success) {
            setAlertMessage(success);
            setAlertVariant('success');
            setAlertVisible(true);
        }
        if (error) {
            setAlertMessage(error);
            setAlertVariant('error');
            setAlertVisible(true);
        }
        
        // Auto-hide the alert after 5 seconds
        const timer = setTimeout(() => {
            setAlertVisible(false);
        }, 5000);
        
        return () => clearTimeout(timer);
    }, [success, error]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const fetchedUsers = await SuperAdminService.getAllUsers();
            setUsers(fetchedUsers);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setAlertMessage("Failed to fetch users. Please try again.");
            setAlertVariant('error');
            setAlertVisible(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const confirmDeleteUser = (id: number) => {
        setUserToDelete(id);
        setDeleteDialogOpen(true);
    };
    
    const deleteUser = async () => {
        if (userToDelete) {
            try {
                setDeleteDialogOpen(false);
                const response = await SuperAdminService.deleteUser(userToDelete);
                
                setAlertMessage(response.message || "User deleted successfully");
                setAlertVariant('success');
                setAlertVisible(true);
                
                // Refresh the user list
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                setAlertMessage("Failed to delete user. Please try again.");
                setAlertVariant('error');
                setAlertVisible(true);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />
            <div className="space-y-6 p-8">
                {alertVisible && (
                    <Alert variant={alertVariant === 'error' ? 'destructive' : 'default'} className="mb-6">
                        {alertVariant === 'success' ? (
                            <CheckCircle className="h-4 w-4" />
                        ) : (
                            <AlertTriangle className="h-4 w-4" />
                        )}
                        <AlertTitle>{alertVariant === 'success' ? 'Success' : 'Error'}</AlertTitle>
                        <AlertDescription>{alertMessage}</AlertDescription>
                    </Alert>
                )}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                        <p className="text-muted-foreground mt-2">
                            Manage all users and admin accounts in the system
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/superadmin/users/create">
                            <PlusCircle className="mr-2 h-4 w-4" /> Create New User
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border">
                    {loading ? (
                        <div className="flex justify-center items-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableCaption>A list of all users in the system</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Verified</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <span className={
                                                user.role === 'super_admin' 
                                                    ? 'bg-destructive/20 text-destructive px-2 py-1 rounded-md font-medium' 
                                                    : user.role === 'admin' 
                                                        ? 'bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-medium' 
                                                        : 'bg-neutral-100 text-neutral-800 px-2 py-1 rounded-md'
                                            }>
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {user.email_verified_at ? 'Yes' : 'No'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/superadmin/users/${user.id}/edit`}>
                                                        <UserCog className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                {user.role !== 'super_admin' && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        onClick={() => confirmDeleteUser(user.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteUser}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}