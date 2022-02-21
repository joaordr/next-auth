import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies } from "nookies";

export function withSSRGuest(fn: GetServerSideProps) {
    return async (ctx: GetServerSidePropsContext) => {
        const cookies = parseCookies(ctx);

        if (cookies['nextAuth.token']) {
            return {
                redirect: {
                    destination: '/dashboard',
                    permanent: false
                }
            }
        }

        return await fn(ctx);
    }
}