import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormEventHandler, useEffect, useState } from 'react';
import { Lock, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface SecuritySettingsProps {
    securitySettings: {
        session: {
            lifetime: number;
            expire_on_close: boolean;
            secure: boolean | null;
            http_only: boolean;
            same_site: string;
        };
        auth: {
            password_timeout: number;
            password_reset_expiry: number;
        };
    };
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
        href: '/admin/super',
    },
    {
        title: 'Security Settings',
        href: '/admin/super/security/settings',
    },
];

export default function SecuritySettings({ securitySettings, success, error }: SecuritySettingsProps) {
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const { data, setData, put, processing, errors } = useForm({
        'session.lifetime': securitySettings.session.lifetime,
        'session.expire_on_close': securitySettings.session.expire_on_close,
        'session.same_site': securitySettings.session.same_site,
    });

    useEffect(() => {
        if (success) {
            setShowSuccessAlert(true);
            // Auto-hide success alert after 5 seconds
            const timer = setTimeout(() => setShowSuccessAlert(false), 5000);
            return () => clearTimeout(timer);
        }
        if (error) {
            setShowErrorAlert(true);
        }
    }, [success, error]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setShowConfirmDialog(true);
    };

    const handleConfirmSubmit = () => {
        put(route('superadmin.security.settings.update'));
        setShowConfirmDialog(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Security Settings" />
            <div className="space-y-6 p-8">
                <div className="flex items-center space-x-2">
                    <ShieldAlert className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold tracking-tight">Security Settings</h2>
                </div>
                <p className="text-muted-foreground">
                    Configure security settings for the application. These settings affect how sessions and authentication work.
                </p>

                {showSuccessAlert && (
                    <Alert className="bg-green-100 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {showErrorAlert && (
                    <Alert className="bg-red-100 text-red-800">
                        <XCircle className="h-5 w-5" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={submit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Security</CardTitle>
                            <CardDescription>Configure session behavior and security options</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="session-lifetime">Session Lifetime (minutes)</Label>
                                <Input
                                    id="session-lifetime"
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={data['session.lifetime']}
                                    onChange={(e) => setData('session.lifetime', parseInt(e.target.value))}
                                />
                                {errors['session.lifetime'] && (
                                    <p className="text-sm text-destructive">{errors['session.lifetime']}</p>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">
                                    How long a session will be valid before it expires (in minutes). Default is 120 minutes (2 hours).
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="expire-on-close">Expire On Close</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Whether sessions should expire when the browser is closed
                                    </p>
                                </div>
                                <Switch
                                    id="expire-on-close"
                                    checked={data['session.expire_on_close']}
                                    onCheckedChange={(checked) => setData('session.expire_on_close', checked)}
                                />
                            </div>

                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="same-site">SameSite Cookie Attribute</Label>
                                <Select
                                    value={data['session.same_site']}
                                    onValueChange={(value) => setData('session.same_site', value)}
                                >
                                    <SelectTrigger id="same-site">
                                        <SelectValue placeholder="Select a SameSite value" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="lax">Lax (Default, more secure)</SelectItem>
                                        <SelectItem value="strict">Strict (Most secure)</SelectItem>
                                        <SelectItem value="none">None (Less secure)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors['session.same_site'] && (
                                    <p className="text-sm text-destructive">{errors['session.same_site']}</p>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">
                                    Controls when cookies are sent in cross-site requests. 'Lax' is recommended
                                    for most applications.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <div className="flex items-center">
                                <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    These settings affect how user sessions are managed.
                                </p>
                            </div>
                            <Button type="submit" disabled={processing}>Save Settings</Button>
                        </CardFooter>
                    </Card>
                </form>

                <Card>
                    <CardHeader>
                        <CardTitle>Authentication Settings</CardTitle>
                        <CardDescription>View current authentication configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h3 className="font-medium">Password Confirmation Timeout</h3>
                                <p className="text-muted-foreground">{securitySettings.auth.password_timeout} seconds</p>
                                <p className="text-xs text-muted-foreground">
                                    Time window after password confirmation during which users are not asked to confirm again.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium">Password Reset Token Expiry</h3>
                                <p className="text-muted-foreground">{securitySettings.auth.password_reset_expiry} minutes</p>
                                <p className="text-xs text-muted-foreground">
                                    How long a password reset link is valid before it expires.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-md bg-amber-50 p-4 text-amber-800 text-sm">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ShieldAlert className="h-5 w-5 text-amber-800" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-amber-800">Security Note</h3>
                                    <div className="mt-2 text-amber-700">
                                        <p>
                                            Authentication timeout settings can only be modified in the <span className="font-mono">.env</span> file
                                            or in the corresponding configuration files. Changes to these settings require a server restart.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Security Changes</AlertDialogTitle>
                            <AlertDialogDescription>
                                You are about to update critical security settings. These changes will affect all users and how sessions are managed.
                                Are you sure you want to continue?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                            <Button onClick={handleConfirmSubmit} disabled={processing}>
                                {processing ? "Saving..." : "Save Changes"}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}