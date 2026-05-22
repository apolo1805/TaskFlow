import axiosClient from './axiosClient';

export interface Card {
  id:          string;
  title:       string;
  description: string | null;
  position:    number;
  dueDate:     string | null;
  columnId:    string;
  createdAt:   string;
}

export const getCards = async (columnId: string): Promise<Card[]> => {
  const { data } = await axiosClient.get<Card[]>(`/cards/column/${columnId}`);
  return data;
};

export const createCard = async (
  title: string,
  columnId: string,
  description?: string,
  dueDate?: string
): Promise<Card> => {
  const { data } = await axiosClient.post<Card>('/cards', {
    title,
    columnId,
    description,
    dueDate,
  });
  return data;
};

export const updateCard = async (
  id: string,
  title: string,
  description?: string,
  dueDate?: string
): Promise<Card> => {
  const { data } = await axiosClient.put<Card>(`/cards/${id}`, {
    title,
    description,
    dueDate,
  });
  return data;
};

export const moveCard = async (
  id: string,
  columnId: string,
  position: number
): Promise<Card> => {
  const { data } = await axiosClient.patch<Card>(`/cards/${id}/move`, {
    columnId,
    position,
  });
  return data;
};

export const deleteCard = async (id: string): Promise<void> => {
  await axiosClient.delete(`/cards/${id}`);
};