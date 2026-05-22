import axiosClient from './axiosClient';

export interface Board {
  id:          string;
  name:        string;
  description: string | null;
  createdAt:   string;
}

export const getBoards = async (): Promise<Board[]> => {
  const { data } = await axiosClient.get<Board[]>('/boards');
  return data;
};

export const createBoard = async (
  name: string,
  description?: string
): Promise<Board> => {
  const { data } = await axiosClient.post<Board>('/boards', { name, description });
  return data;
};

export const updateBoard = async (
  id: string,
  name: string,
  description?: string
): Promise<Board> => {
  const { data } = await axiosClient.put<Board>(`/boards/${id}`, { name, description });
  return data;
};

export const deleteBoard = async (id: string): Promise<void> => {
  await axiosClient.delete(`/boards/${id}`);
};