import React, { useEffect, useRef, useState } from 'react';
import AllocationFormModal from './AllocationFormModal';

const AddAllocationAction = ({
    editingBudgetItem,
    setEditingBudgetItem,
    handleAddProductSubmit,
    handleUpdateProductSubmit,
    handleSearchProducts, // This is the API call function from App
    budgetItems, // Pass budgetItems from parent for filtering search results
}) => {
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(false); // Loading for internal search debounce
    const debounceTimeoutRef = useRef(null);

    // Debounce effect for product search within this component
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Only search if searchTerm is not empty AND (not editing OR no product already selected)
        // This prevents re-searching when editing an item (as the product is already selected)
        if (searchTerm.trim().length > 0 && !editingBudgetItem && !selectedProduct) {
            setLoading(true); // Indicate loading for search
            debounceTimeoutRef.current = setTimeout(async () => {
                try {
                    const results = await handleSearchProducts(searchTerm); // Call the API search function

                    // Filter out products that are already in the current budget
                    const existingBudgetItemIds = new Set(
                        (budgetItems || []).map(item => item.product_id)
                    );
                    const filteredResults = results.filter(
                        product => !existingBudgetItemIds.has(product.id)
                    );
                    setSearchResults(filteredResults);
                } catch (err) {
                    console.error("Error searching products in modal:", err);
                    setSearchResults([]); // Clear results on error
                } finally {
                    setLoading(false); // End loading for search
                }
            }, 300); // Debounce time: 300ms
        } else {
            setSearchResults([]); // Clear search results if search term is empty or not in add mode or product is selected
            setLoading(false); // Reset loading state
        }
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm, editingBudgetItem, selectedProduct, handleSearchProducts, budgetItems]);

    // Effect to initialize states when editingBudgetItem changes
    useEffect(() => {
        if (editingBudgetItem) {
            setSelectedProduct(editingBudgetItem); // Set selected product to the item being edited
            setSearchTerm(editingBudgetItem.item_name || ''); // Pre-fill search term
            setSearchResults([]); // Clear search results as we have a selected product
        } else {
            // Reset if editingBudgetItem becomes null (e.g., after closing modal)
            setSelectedProduct(null);
            setSearchTerm('');
            setSearchResults([]);
        }
    }, [editingBudgetItem]);


    const handleAddButtonClick = () => {
        setShowModal(true);
        setEditingBudgetItem(null); // Ensure we are in add mode
        setSelectedProduct(null); // Clear selected product when opening for add
        setSearchTerm(''); // Clear search term
        setSearchResults([]); // Clear search results
    };

    return (
        <>
            <button
                onClick={handleAddButtonClick}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out shadow-md transform hover:scale-105"
            >
                Add Product Allocation
            </button>

            {showModal && (
                <AllocationFormModal
                    editingBudgetItem={editingBudgetItem}
                    setEditingBudgetItem={setEditingBudgetItem}
                    handleAddProductSubmit={handleAddProductSubmit}
                    handleUpdateProductSubmit={handleUpdateProductSubmit}
                    setShowModal={setShowModal}
                    // Pass search-related states and setters from this component
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    searchResults={searchResults}
                    setSearchResults={setSearchResults}
                    selectedProduct={selectedProduct}
                    setSelectedProduct={setSelectedProduct}
                    loading={loading}
                />
            )}
        </>
    );
};

export default AddAllocationAction;