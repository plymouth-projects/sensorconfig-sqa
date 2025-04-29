import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Loader2, UserCog, ShieldCheck, Key, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SuperAdminService } from '@/services/SuperAdminService';
import { UserWithRole } from '@/types/admin';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface EditUserPageProps {
    userId: number;
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
    {
        title: 'Edit User',
        href: '#',
    },
];

export default function EditUser({ userId }: EditUserPageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [user, setUser] = useState<UserWithRole | null>(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState<'success' | 'error'>('success');
    
    // Basic info form
    const [basicInfo, setBasicInfo] = useState({
        name: '',
        email: '',
        role: '',
    });
    
    // Password form
    const [passwordForm, setPasswordForm] = useState({
        password: '',
        password_confirmation: '',
    });
    
    // Form errors
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Fetch user data
    useEffect(() => {
        const fetchUser = async () => {
            try {
                setIsLoading(true);
                const userData = await SuperAdminService.getUserById(userId);
                setUser(userData);
                setBasicInfo({
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                });
            } catch (error) {
                console.error('Failed to fetch user:', error);
                setAlertMessage("Failed to load user data. Please try again.");
                setAlertVariant('error');
                setAlertVisible(true);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchUser();
    }, [userId]);
    
    // Auto-hide alert after 5 seconds
    useEffect(() => {
        if (alertVisible) {
            const timer = setTimeout(() => {
                setAlertVisible(false);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [alertVisible]);
    
    // Handle basic info changes
    const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBasicInfo(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    // Handle role change
    const handleRoleChange = (value: string) => {
        setBasicInfo(prev => ({
            ...prev,
            role: value
        }));
        
        // Clear error
        if (errors.role) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.role;
                return newErrors;
            });
        }
    };
    
    // Handle password form change
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    // Validate basic info form
    const validateBasicInfo = () => {
        const newErrors: Record<string, string> = {};
        
        if (!basicInfo.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!basicInfo.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(basicInfo.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!basicInfo.role) {
            newErrors.role = 'Role is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Validate password form
    const validatePasswordForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!passwordForm.password) {
            newErrors.password = 'Password is required';
        } else if (passwordForm.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        
        if (passwordForm.password !== passwordForm.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Submit basic info form
    const handleSaveBasicInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateBasicInfo()) {
            return;
        }
        
        setIsSaving(true);
        
        try {
            await SuperAdminService.updateUser(userId, {
                name: basicInfo.name,
                email: basicInfo.email,
                role: basicInfo.role as 'super_admin' | 'admin' | 'monitoring_admin' | 'user',
            });
            
            // Update local user state
            if (user) {
                setUser({
                    ...user,
                    name: basicInfo.name,
                    email: basicInfo.email,
                    role: basicInfo.role as 'super_admin' | 'admin' | 'monitoring_admin' | 'user',
                });
            }
            
            setAlertMessage("User information updated successfully.");
            setAlertVariant('success');
            setAlertVisible(true);
        } catch (error: any) {
            console.error('Error updating user:', error);
            
            // Handle validation errors from backend
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            
            setAlertMessage("Failed to update user information. Please try again.");
            setAlertVariant('error');
            setAlertVisible(true);
        } finally {
            setIsSaving(false);
        }
    };
    
    // Submit password form
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validatePasswordForm()) {
            return;
        }
        
        setIsChangingPassword(true);
        
        try {
            await SuperAdminService.changeUserPassword(
                userId, 
                passwordForm.password,
                passwordForm.password_confirmation
            );
            
            // Reset form
            setPasswordForm({
                password: '',
                password_confirmation: '',
            });
            
            setAlertMessage("Password changed successfully.");
            setAlertVariant('success');
            setAlertVisible(true);
        } catch (error: any) {
            console.error('Error changing password:', error);
            
            // Handle validation errors from backend
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            
            setAlertMessage("Failed to change password. Please try again.");
            setAlertVariant('error');
            setAlertVisible(true);
        } finally {
            setIsChangingPassword(false);
        }
    };
    
    // Handle assigning role
    const handleAssignRole = async (role: string) => {
        if (user?.role === role) {
            // No change needed
            return;
        }
        
        try {
            await SuperAdminService.assignRoles(userId, [role]);
            
            // Update local user state and basic info
            if (user) {
                setUser({
                    ...user,
                    role: role as 'super_admin' | 'admin' | 'monitoring_admin' | 'user',
                });
                setBasicInfo(prev => ({
                    ...prev,
                    role,
                }));
            }
            
            setAlertMessage(`Role updated to ${role} successfully.`);
            setAlertVariant('success');
            setAlertVisible(true);
        } catch (error: any) {
            console.error('Error updating role:', error);
            
            setAlertMessage("Failed to update role. Please try again.");
            setAlertVariant('error');
            setAlertVisible(true);
        }
    };

    if (isLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit User" />
                <div className="flex justify-center items-center h-[80vh]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="User Not Found" />
                <div className="py-8 px-8 md:px-12 max-w-5xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight">User Not Found</h1>
                        <p className="text-muted-foreground mt-2">
                            The requested user could not be found
                        </p>
                        <Button className="mt-4" asChild>
                            <Link href="/superadmin/users">Back to Users</Link>
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit User: ${user.name}`} />
            
            <div className="py-8 px-8 md:px-12 w-full max-w-5xl mx-auto">
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
                
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit User: {user.name}</h1>
                        <p className="text-muted-foreground mt-2">
                            ID: {user.id} | Created: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/superadmin/users">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
                        </Link>
                    </Button>
                </div>
                
                <Tabs defaultValue="info" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="info" className="flex items-center gap-2">
                            <UserCog className="h-4 w-4" /> Basic Information
                        </TabsTrigger>
                        <TabsTrigger value="password" className="flex items-center gap-2">
                            <Key className="h-4 w-4" /> Change Password
                        </TabsTrigger>
                        <TabsTrigger value="roles" className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Roles & Permissions
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="info" className="rounded-lg border p-6 bg-card">
                        <form onSubmit={handleSaveBasicInfo} className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="Enter user's full name"
                                            value={basicInfo.name}
                                            onChange={handleBasicInfoChange}
                                            className={errors.name ? "border-destructive" : ""}
                                        />
                                        {errors.name && (
                                            <p className="text-destructive text-sm">{errors.name}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="user@example.com"
                                            value={basicInfo.email}
                                            onChange={handleBasicInfoChange}
                                            className={errors.email ? "border-destructive" : ""}
                                        />
                                        {errors.email && (
                                            <p className="text-destructive text-sm">{errors.email}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="role">User Role</Label>
                                        <Select 
                                            value={basicInfo.role} 
                                            onValueChange={handleRoleChange}
                                        >
                                            <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">Regular User</SelectItem>
                                                <SelectItem value="monitoring_admin">Monitoring Admin</SelectItem>
                                                <SelectItem value="admin">Administrator</SelectItem>
                                                <SelectItem value="super_admin">Super Administrator</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.role && (
                                            <p className="text-destructive text-sm">{errors.role}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </TabsContent>
                    
                    <TabsContent value="password" className="rounded-lg border p-6 bg-card">
                        <form onSubmit={handleChangePassword} className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="Minimum 8 characters"
                                            value={passwordForm.password}
                                            onChange={handlePasswordChange}
                                            className={errors.password ? "border-destructive" : ""}
                                        />
                                        {errors.password && (
                                            <p className="text-destructive text-sm">{errors.password}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type="password"
                                            placeholder="Re-enter password"
                                            value={passwordForm.password_confirmation}
                                            onChange={handlePasswordChange}
                                            className={errors.password_confirmation ? "border-destructive" : ""}
                                        />
                                        {errors.password_confirmation && (
                                            <p className="text-destructive text-sm">{errors.password_confirmation}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isChangingPassword}>
                                        {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </TabsContent>
                    
                    <TabsContent value="roles" className="rounded-lg border p-6 bg-card">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold">Current Role</h3>
                                <p className="text-muted-foreground mb-4">
                                    Change the user's role to grant or restrict access to different areas of the system
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                    <Button 
                                        variant={user.role === 'user' ? 'default' : 'outline'}
                                        className="justify-start"
                                        onClick={() => handleAssignRole('user')}
                                        disabled={user.role === 'user'}
                                    >
                                        Regular User
                                    </Button>
                                    <Button 
                                        variant={user.role === 'monitoring_admin' ? 'default' : 'outline'}
                                        className="justify-start"
                                        onClick={() => handleAssignRole('monitoring_admin')}
                                        disabled={user.role === 'monitoring_admin'}
                                    >
                                        Monitoring Admin
                                    </Button>
                                    <Button 
                                        variant={user.role === 'admin' ? 'default' : 'outline'}
                                        className="justify-start"
                                        onClick={() => handleAssignRole('admin')}
                                        disabled={user.role === 'admin'}
                                    >
                                        Administrator
                                    </Button>
                                    <Button 
                                        variant={user.role === 'super_admin' ? 'default' : 'outline'}
                                        className="justify-start"
                                        onClick={() => handleAssignRole('super_admin')}
                                        disabled={user.role === 'super_admin'}
                                    >
                                        Super Admin
                                    </Button>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                                <h3 className="text-lg font-semibold">Role Permissions</h3>
                                <p className="text-muted-foreground">
                                    These permissions are granted automatically based on the selected role
                                </p>
                                
                                <div className="mt-4 space-y-2">
                                    {user.role === 'super_admin' && (
                                        <>
                                            <p>• Full system access</p>
                                            <p>• Manage all users and their permissions</p>
                                            <p>• Configure system settings</p>
                                            <p>• Access to maintenance and backup features</p>
                                            <p>• View system logs and statistics</p>
                                        </>
                                    )}
                                    
                                    {user.role === 'admin' && (
                                        <>
                                            <p>• Manage sensors and monitoring devices</p>
                                            <p>• Configure alert thresholds and notifications</p>
                                            <p>• Access to all reports and data analytics</p>
                                            <p>• Manage regular users</p>
                                        </>
                                    )}
                                    
                                    {user.role === 'monitoring_admin' && (
                                        <>
                                            <p>• View all monitoring data</p>
                                            <p>• Configure basic alert parameters</p>
                                            <p>• Run reports and access analytics</p>
                                        </>
                                    )}
                                    
                                    {user.role === 'user' && (
                                        <>
                                            <p>• View public dashboards</p>
                                            <p>• Access to basic reports</p>
                                            <p>• Receive notifications</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}