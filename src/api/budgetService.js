import axios from 'axios';
import { handleApiResponse } from '../lib/handleApiResponse';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`; // Your backend URL

// Helper function to handle common API response structure

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

export const addBudgetItem = async (budgetId, itemData) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${budgetId}/items`, itemData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in addBudgetItem:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to add budget item');
    }
};

export const updateBudgetItem = async (budgetId, budgetItemId, itemData) => {
    try {
        const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${budgetId}/items/${budgetItemId}`, itemData);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in updateBudgetItem:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update budget item');
    }
};

export const deleteBudgetItem = async (budgetId, budgetItemId) => {
    try {
        const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/budgets/${budgetId}/items/${budgetItemId}`);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error in deleteBudgetItem:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to delete budget item');
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

export const updateBudgetFromTransactionAPI = async (budgetId, transactionDetails) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/budgets/update-budget-from-transaction/${budgetId}`, transactionDetails);
        return response.data;
    } catch (error) {
        console.error('Error updating budget from transaction API:', error.response?.data || error.message);
        throw error; // Re-throw to be caught by the calling function
    }
};

export const updateBudgetFromConsumption = async (budgetId, consumptionDetails) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/budgets/update-budget-from-consumption/${budgetId}`, consumptionDetails);
        return response.data;
    } catch (error) {
        console.error('Error updating budget from transaction API:', error.response?.data || error.message);
        throw error; // Re-throw to be caught by the calling function
    }
};



// calculations
export const getBudgetDayInfo = (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.ceil((today - start) / (1000 * 60 * 60 * 24)) + 1;
    const remainingDays = totalDays - currentDay;

    return {
        currentDay: currentDay < 1 ? 0 : currentDay,
        remainingDays: remainingDays < 0 ? 0 : remainingDays,
        totalDays,
    };
};