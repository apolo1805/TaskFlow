import axiosClient from './axiosClient';

interface AuthPayload {
    token: string;
    email: string;
    displayName: string;
}

export const register = async (
    email: string,
     password: string,
      displayName: string
    ): Promise<AuthPayload> => {
    const { data } = await axiosClient.post('/auth/register', { 
        email,
        password,
        displayName 
    });

    return data;
}

export const login = async (
    email: string,
     password: string
    ): Promise<AuthPayload> => {
    const { data } = await axiosClient.post('/auth/login', { 
        email,
        password
    });

    return data;
}