import { Console } from "console";
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import decode from 'jwt-decode';
import { User, ValidadeUserPermissions } from "./ValidateUserPermissions";

interface WithSSRAuthOptions {
    permissions?: string[],
    roles?: string[],
}

export function withSSRAuth(fn: GetServerSideProps, options?: WithSSRAuthOptions) {
    return async (ctx: GetServerSidePropsContext) => {
        const cookies = parseCookies(ctx);
        const token = cookies['nextAuth.token'];

        if (!cookies['nextAuth.token']) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }

        if (options) {
            const user = decode<{ permissions: string[], roles: string[] }>(token);
            const { permissions, roles } = options;

            const userHasValidPermissions = ValidadeUserPermissions({ user, permissions, roles });
            if (!userHasValidPermissions) {
                return {
                    redirect: {
                        destination: '/dashboard',
                        permanent: false
                    }
                }
            }

        }

        try {
            return await fn(ctx);
        } catch (error) {
            destroyCookie(ctx, 'nextAuth.token');
            destroyCookie(ctx, 'nextAuth.RefreshToken');

            return {
                redirect: {
                    destination: '/',
                    permanent: false,
                }
            }

        }

    }
}