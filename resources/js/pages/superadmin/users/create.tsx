import { Head, Link, router } from '@inertiajs/react';
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
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { SuperAdminService } from '@/services/SuperAdminService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
        title: 'User Management',
        href: '/admin/super/users',
    },
    {
        title: 'Create User',
        href: '/admin/super/users/create',
    },
];

export default function CreateUser() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertVariant, setAlertVariant] = useState<'success' | 'error'>('success');
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user',
    });
    
    // Form validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const handleRoleChange = (value: string) => {
        setFormData(prev => ({
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
    
    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        
        if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = 'Passwords do not match';
        }
        
        if (!formData.role) {
            newErrors.role = 'Role is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await SuperAdminService.createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role as 'super_admin' | 'admin' | 'monitoring_admin' | 'user',
            });
            
            setAlertMessage("User created successfully");
            setAlertVariant('success');
            setAlertVisible(true);
            
            // Redirect to users list page using Inertia router after a short delay
            setTimeout(() => {
                router.visit('/superadmin/users');
            }, 1500);
        } catch (error: any) {
            console.error('Error creating user:', error);
            
            // Handle validation errors from backend
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setAlertMessage(error.response?.data?.message || "Failed to create user. Please try again.");
                setAlertVariant('error');
                setAlertVisible(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />
            
            <div className="py-8 px-8 md:px-12 w-full max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
                        <p className="text-muted-foreground mt-2">
                            Add a new user or administrator to the system
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/superadmin/users">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
                        </Link>
                    </Button>
                </div>
                
                <div className="rounded-lg border p-6 bg-card">
                    {alertVisible && (
                        <Alert variant={alertVariant === 'error' ? 'destructive' : 'default'}>
                            {alertVariant === 'success' ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                            <AlertTitle>{alertVariant === 'success' ? 'Success' : 'Error'}</AlertTitle>
                            <AlertDescription>{alertMessage}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Enter user's full name"
                                        value={formData.name}
                                        onChange={handleChange}
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
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={errors.email ? "border-destructive" : ""}
                                    />
                                    {errors.email && (
                                        <p className="text-destructive text-sm">{errors.email}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={errors.password ? "border-destructive" : ""}
                                    />
                                    {errors.password && (
                                        <p className="text-destructive text-sm">{errors.password}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        placeholder="Re-enter password"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        className={errors.password_confirmation ? "border-destructive" : ""}
                                    />
                                    {errors.password_confirmation && (
                                        <p className="text-destructive text-sm">{errors.password_confirmation}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="role">User Role</Label>
                                    <Select 
                                        value={formData.role} 
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
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create User
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}