import { createContext } from "react";

type SignCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIm(credentials): Promise<void>;
}

const AuthContext = createContext({});