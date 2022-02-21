import axios, { AxiosError } from 'axios';
import Router from 'next/router';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestQueue = [];

export const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
        Authorization: `Bearer ${cookies['nextAuth.token']}`
    }
});

api.interceptors.response.use(response => { return response; }, (error: AxiosError) => {
    if (error.response.status === 401) {
        if (error.response.data?.code === 'token.expired') {
            cookies = parseCookies();

            const { 'nextAuth.refreshToken': refreshToken } = cookies;
            const originalConfig = error.config;

            if (!isRefreshing) {
                isRefreshing = true;
                api.post('/refresh', {
                    refreshToken
                }).then(response => {
                    const { token } = response.data;

                    setCookie(undefined, 'nextAuth.token', token, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/'
                    });

                    setCookie(undefined, 'nextAuth.refreshToken', response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/'
                    });

                    api.defaults.headers['Authorization'] = `Bearer ${token}`;

                    failedRequestQueue.forEach(request => request.onSucess(token));
                    failedRequestQueue = [];
                }).catch(error => {
                    failedRequestQueue.forEach(request => request.onFailure(error));
                    failedRequestQueue = [];
                }).finally(() => {
                    isRefreshing = false;
                })
            }

            return new Promise((resolve, reject) => {
                failedRequestQueue.push({
                    onSucess: (token: string) => {
                        originalConfig.headers['Authorization'] = `Bearer ${token}`;
                        resolve(api(originalConfig))
                    },
                    onFailure: (error: AxiosError) => {
                        reject(error);
                    },
                })
            })

        } else {
            signOut();
        }
    }

    return Promise.reject(error);
})