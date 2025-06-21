import axios from "axios";
import { handleApiResponse } from "../lib/handleApiResponse";
import { toast } from "react-toastify";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`; // Your backend URL

export const fetchTransactions = async (budgetId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/transactions/${budgetId}`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in fetchTransactions:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
    }
};

export const createTransaction = async (transactionData, budgetId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/transactions/${budgetId}`, transactionData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in createTransaction:', error.response?.data?.message || error.message);
        toast.error(error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create transaction');
    }
};

export const updateTransaction = async (id, transactionData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/transactions/${id}`, transactionData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in updateTransaction:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update transaction');
    }
};

export const deleteTransaction = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/transactions/${id}`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in deleteTransaction:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to delete transaction');
    }
};