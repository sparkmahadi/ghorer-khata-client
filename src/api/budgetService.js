import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Your backend URL

// Helper function to handle common API response structure
const handleApiResponse = (response) => {
    if (response.data.success) {
        return response.data.data;
    } else {
        // If backend explicitly sends success: false, throw an error with its message
        throw new Error(response.data.message || 'An unknown error occurred');
    }
};

export const fetchBudgetById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/budgets/${id}`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in fetchBudgetById:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch budget');
    }
};

export const createBudget = async (budgetData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/budgets`, budgetData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in createBudget:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to create budget');
    }
};

export const updateBudget = async (id, budgetData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/budgets/${id}`, budgetData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in updateBudget:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update budget');
    }
};

export const deleteBudget = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/budgets/${id}`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in deleteBudget:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to delete budget');
    }
};

export const fetchTransactions = async (params = {}) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/transactions`, { params });
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in fetchTransactions:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
    }
};

export const createTransaction = async (transactionData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/transactions`, transactionData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in createTransaction:', error.response?.data?.message || error.message);
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

// New API call for fetching all categories (if you've added a backend controller for this)
export const fetchAllCategories = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/categories`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in fetchAllCategories:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch all categories');
    }
};