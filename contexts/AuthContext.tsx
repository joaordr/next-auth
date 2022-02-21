import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import Router from "next/router";

import { api } from "../services/apiClient";

type User = {
    email: string;
    permissions: string[],
    roles: string[],
}

type SignCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn: (credentials: SignCredentials) => Promise<void>;
    signOut: () => void;
    user: User;
    isAuthenticated: boolean;
}

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut() {
    destroyCookie(undefined, 'nextAuth.token');
    destroyCookie(undefined, 'nextAuth.refreshToken');

    authChannel.postMessage('signOut');

    Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth');
        authChannel.onmessage = (message) => {
            switch (message.data) {
                case 'signOut':
                    destroyCookie(undefined, 'nextAuth.token');
                    destroyCookie(undefined, 'nextAuth.refreshToken');
                    Router.push('/');
                    break;
                case 'signIn':
                    document.location.reload();
                    break;
                default:
                    break;
            }
        }
    }, [])

    useEffect(() => {
        const { 'nextAuth.token': token } = parseCookies();

        if (token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data;
                setUser({ email, permissions, roles });
            }).catch(error => {
                signOut();
            })
        }

    }, [])

    async function signIn({ email, password }: SignCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password
            })

            const { token, refreshToken, permissions, roles } = response.data;

            setCookie(undefined, 'nextAuth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });
            setCookie(undefined, 'nextAuth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });

            setUser({ email, permissions, roles });

            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            authChannel.postMessage('signIn');
            Router.push('/dashboard');
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}