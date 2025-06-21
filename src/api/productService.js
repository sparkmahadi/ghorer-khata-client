import axios from "axios";
import { handleApiResponse } from "../lib/handleApiResponse";


// New API function to search master products (if not already existing)
export const searchMasterProducts = async (searchTerm) => {
    try {
        // This endpoint needs to exist on your backend to search master products
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products/search?q=${searchTerm}`);
        console.log(response);
        return handleApiResponse(response);
    } catch (error) {
        console.error('Error searching master products:', error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || 'Failed to search products');
    }
};