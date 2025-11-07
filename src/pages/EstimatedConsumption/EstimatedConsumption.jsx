import React, { useState, useEffect, useMemo, useCallback } from "react";
import API from "../../api/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "react-router";

// Key for storing unit prices in localStorage
const UNIT_PRICES_STORAGE_KEY = "mealPlanUnitPrices";

export default function EstimatedConsumption() {
    const param = useParams();
    const mealPlanId = param.id;
    const [ingredients, setIngredients] = useState([]);
    const [familyCount, setFamilyCount] = useState(5);
    const [loading, setLoading] = useState(false);
    // New state to hold unit prices, keyed by ingredientId
    const [unitPrices, setUnitPrices] = useState({});

    // Load unit prices from localStorage on component mount
    useEffect(() => {
        const storedPrices = localStorage.getItem(UNIT_PRICES_STORAGE_KEY);
        if (storedPrices) {
            setUnitPrices(JSON.parse(storedPrices));
        }
    }, []);

    // Effect to save unit prices to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(UNIT_PRICES_STORAGE_KEY, JSON.stringify(unitPrices));
    }, [unitPrices]);

    // Fetch ingredient data
    const fetchIngredients = async () => {
        if (!mealPlanId) return;
        try {
            setLoading(true);
            const res = await API.get(`/mealplans/ingredient-requirement/${mealPlanId}`);
            if (res.data.success) {
                // Ensure the ingredient data structure is clean
                setIngredients(res.data.data.map(item => ({
                    ...item,
                    // Ensure totalQty is treated as a number
                    totalQty: Number(item.totalQty) 
                })));
            } else {
                toast.error("Failed to fetch ingredients");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error fetching ingredients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIngredients();
    }, [mealPlanId]);

    // Handle family count change
    const handleFamilyCountChange = (e) => {
        const value = Number(e.target.value);
        if (value >= 1) setFamilyCount(value);
        // Optional: clear if input is empty, but generally >=1 is good for logic
        if (e.target.value === "") setFamilyCount(""); 
    };

    // Handle unit price change for a specific ingredient
    const handleUnitPriceChange = useCallback((ingredientId, e) => {
        let value = e.target.value;
        // Allow empty string for clearing input, otherwise parse as number
        const price = value === "" ? "" : Number(value); 
        
        // Update the unitPrices state
        setUnitPrices(prevPrices => ({
            ...prevPrices,
            [ingredientId]: price,
        }));
    }, []);

    // Calculate all consumption and cost data in a memoized structure
    const calculatedData = useMemo(() => {
        let totalMonthlyCost = 0;

        const data = ingredients.map(item => {
            // Weekly Quantity is the base quantity from API * family count
            const weeklyQuantity = item.totalQty * familyCount;
            // Monthly Consumption (assuming 4 weeks per month)
            const monthlyConsumption = weeklyQuantity * 4; 
            // Unit price from state, defaulting to 0 if not set or invalid
            const unitPrice = Number(unitPrices[item.ingredientId]) || 0; 
            
            // Monthly Cost = Monthly Consumption * Unit Price
            // We assume the Unit Price is for the unit specified (e.g., price per 'g', 'ml', or 'pcs')
            const monthlyCost = monthlyConsumption * unitPrice;

            totalMonthlyCost += monthlyCost;

            return {
                ...item,
                weeklyQuantity: weeklyQuantity.toFixed(2),
                monthlyConsumption: monthlyConsumption.toFixed(2),
                unitPrice: unitPrice > 0 ? unitPrice : (unitPrices[item.ingredientId] === "" ? "" : 0), // Use raw input if empty string
                monthlyCost: monthlyCost.toFixed(2),
            };
        });

        return { ingredientsData: data, totalMonthlyCost: totalMonthlyCost.toFixed(2) };
    }, [ingredients, familyCount, unitPrices]);


    return (
        <div className="p-4 space-y-4">
            <ToastContainer position="top-right" />
            <h2 className="text-2xl font-bold">🛒 Estimated Meal Plan Consumption & Cost</h2>
            <hr />

            {/* Family Count Input */}
            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg shadow-md">
                <label className="font-semibold text-blue-700">Number of Family Members:</label>
                <input
                    type="number"
                    min="1"
                    // Use a string representation of familyCount for input control when it's 0 (or empty string from state)
                    value={familyCount === 0 && familyCount !== "" ? 1 : familyCount} 
                    onChange={handleFamilyCountChange}
                    className="border border-blue-300 p-2 rounded-lg w-24 text-center focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5"
                />
            </div>

            {/* Ingredient Table */}
            {loading ? (
                <p className="text-gray-600">Loading ingredients...</p>
            ) : ingredients.length === 0 ? (
                <p className="text-red-500">No ingredients found for this meal plan.</p>
            ) : (
                <>
                    <div className="overflow-x-auto mt-4 rounded-lg shadow-xl">
                        <table className="min-w-full border text-sm">
                            <thead className="bg-gray-200 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 border text-left">Ingredient</th>
                                    <th className="px-4 py-3 border">Weekly Qty ({familyCount} members)</th>
                                    <th className="px-4 py-3 border">Unit</th>
                                    <th className="px-4 py-3 border">Monthly Consumption (4 weeks)</th>
                                    <th className="px-4 py-3 border">Unit Price (per unit)</th>
                                    <th className="px-4 py-3 border">Monthly Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calculatedData.ingredientsData.map((item) => (
                                    <tr key={item.ingredientId} className="hover:bg-gray-50">
                                        <td className="border px-4 py-2 font-medium">{item.name}</td>
                                        <td className="border px-4 py-2 text-center">{item.weeklyQuantity}</td>
                                        <td className="border px-4 py-2 text-center">{item.unit}</td>
                                        <td className="border px-4 py-2 text-center font-bold text-indigo-600">{item.monthlyConsumption}</td>
                                        <td className="border px-4 py-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => handleUnitPriceChange(item.ingredientId, e)}
                                                className="w-full p-1 border rounded text-center focus:ring-green-500 focus:border-green-500"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className={`border px-4 py-2 text-right ${item.monthlyCost > 0 ? 'font-extrabold text-green-600' : 'text-gray-500'}`}>
                                            {item.monthlyCost}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total Cost Summary */}
                    <div className="flex justify-end pt-4">
                        <div className="p-4 bg-green-100 border-l-4 border-green-500 rounded-lg shadow-lg">
                            <p className="text-lg font-bold text-green-800">
                                Total Estimated Monthly Cost: **{calculatedData.totalMonthlyCost}**
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                                (Based on the quantities and unit prices entered.)
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}