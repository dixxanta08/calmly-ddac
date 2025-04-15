"use client";
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const Logout = () => {
    const router = useRouter();

    useEffect(() => {
        // Call signOut to clear the session
        const logout = async () => {
            await signOut({ redirect: false });  // Don't redirect automatically
            router.push('/auth/login');  // Redirect to the login page after sign-out
        };

        logout();
    }, [router]);

    return (
        <div>
            <h1>Logging out...</h1>
        </div>
    );
};

export default Logout;
