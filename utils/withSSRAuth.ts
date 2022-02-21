import { Console } from "console";
import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";

export function withSSRAuth(fn: GetServerSideProps) {
    return async (ctx: GetServerSidePropsContext) => {
        const cookies = parseCookies(ctx);

        if (!cookies['nextAuth.token']) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false
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