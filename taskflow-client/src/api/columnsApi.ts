import axiosClient from './axiosClient';

export interface Column {
    id: string;
    name: string;
    position: number;
    boardId: string;
    createdAt: string;
}

export const getColumns = async (boardId: string): Promise<Column[]> => {
    const { data } = await axiosClient.get<Column[]>(`/columns/board/${boardId}`);
    
    return data;
}

export const createColumn = async (
    name: string,
    boardId: string
    ): Promise<Column> => {
    const { data } = await axiosClient.post<Column>('/columns', {
        name,
        boardId,
    });

    return data;
}

export const updateColumn = async (
    id: string,
    name: string
): Promise<Column> => {
    const { data } = await axiosClient.put<Column>(`/columns/${id}`, { name });

    return data;
};

export const deleteColumn = async (id: string): Promise<void> => {
    await axiosClient.delete(`/columns/${id}`);
}