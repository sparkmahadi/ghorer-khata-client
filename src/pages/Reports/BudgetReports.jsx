import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import {
    PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Sector
} from 'recharts';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Colors for the Pie Chart categories
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Render active shape for Pie Chart (for hover effect)
const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">
                {payload.name}
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                fill={fill}
            />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
                {`Allocated: $${value.toFixed(2)}`}
            </text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
                {`(Rate ${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};


function BudgetReports() {
    const { userInfo, loading: authLoading } = useAuth();
    const userId = userInfo?._id;

    const [availableBudgets, setAvailableBudgets] = useState([]);
    const [selectedBudgetId, setSelectedBudgetId] = useState('');
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [pieChartActiveIndex, setPieChartActiveIndex] = useState(0);

    // Fetch all available budgets for the user
    const fetchUserBudgets = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            if (!userId) {
                // If userId is not available yet, wait for authLoading to complete
                if (authLoading) return;
                throw new Error("User not authenticated.");
            }

            const response = await axios.get(`${BASE_URL}/api/budgets/user/${userId}`);
            if (response.data && Array.isArray(response.data.budgets)) {
                setAvailableBudgets(response.data.budgets);
                if (response.data.budgets.length > 0 && !selectedBudgetId) {
                    // Automatically select the first budget if available and none is selected
                    setSelectedBudgetId(response.data.budgets[0]._id);
                    setSelectedBudget(response.data.budgets[0]); // Directly set the first budget details
                }
            } else {
                setAvailableBudgets([]);
                setSelectedBudget(null);
                toast.info("No budgets found for your account.");
            }
        } catch (err) {
            console.error("Failed to fetch budgets:", err);
            setError(`Error fetching budgets: ${err.response?.data?.message || err.message}`);
            toast.error(`Error fetching budgets: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    }, [userId, authLoading, selectedBudgetId]); // Depend on selectedBudgetId to avoid infinite loop on first render

    // Effect to fetch budgets on component mount or userId/authLoading changes
    useEffect(() => {
        if (!authLoading) { // Only try to fetch when authentication status is known
            fetchUserBudgets();
        }
    }, [authLoading, fetchUserBudgets]);


    // Handle budget selection from dropdown
    const handleBudgetSelect = (e) => {
        const id = e.target.value;
        setSelectedBudgetId(id);
        const budget = availableBudgets.find(b => b._id === id);
        setSelectedBudget(budget);
    };

    // Prepare data for charts
    const getChartData = () => {
        if (!selectedBudget) return { overallData: [], categoryData: [], budgetItemData: [] };

        // Overall Budget Data
        const overallData = [
            { name: 'Allocated', value: selectedBudget.overallAllocatedAmount, fill: '#4CAF50' }, // Green
            { name: 'Utilized', value: selectedBudget.overallUtilizedAmount, fill: '#F44336' },   // Red
            { name: 'Remaining to Allocate', value: (selectedBudget.overallBudgetAmount - selectedBudget.overallAllocatedAmount), fill: '#2196F3' } // Blue
        ].filter(item => item.value > 0); // Filter out zero values for better chart display

        // Category Allocation Data (for Pie Chart)
        const categoryData = selectedBudget.categories.map(cat => ({
            name: cat.name || cat.id, // Use category name if available, otherwise ID
            value: cat.allocatedAmount
        })).filter(item => item.value > 0);

        // Budget Items Allocation vs. Utilization Data (for Bar Chart)
        const budgetItemData = selectedBudget.budgetItems.map(item => ({
            name: item.item_name,
            allocated: item.allocated_amount || 0,
            utilized: item.utilizedAmount || 0,
        })).filter(item => item.allocated > 0 || item.utilized > 0); // Only include items with activity

        return { overallData, categoryData, budgetItemData };
    };

    const { overallData, categoryData, budgetItemData } = getChartData();

    const onPieEnter = useCallback((_, index) => {
        setPieChartActiveIndex(index);
    }, []);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    <p className="mt-4 text-gray-600 text-lg">Loading budget data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-red-50">
                <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded relative shadow-md">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                    <p className="mt-2 text-sm text-gray-600">Please try again later or check your internet connection.</p>
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <p className="text-gray-700 text-lg">Please log in to view budget reports.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8 lg:p-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center mb-8">
                    Budget Reports
                </h1>

                {/* Budget Selection */}
                <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-inner">
                    <label htmlFor="budget-select" className="block text-lg font-semibold text-blue-700 mb-3">
                        Select a Budget to View Report:
                    </label>
                    <select
                        id="budget-select"
                        value={selectedBudgetId}
                        onChange={handleBudgetSelect}
                        className="block w-full md:w-1/2 lg:w-1/3 px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-base appearance-none cursor-pointer transition duration-200"
                    >
                        {availableBudgets.length === 0 ? (
                            <option value="">No budgets available</option>
                        ) : (
                            <>
                                <option value="" disabled>-- Choose a Budget --</option>
                                {availableBudgets.map(budget => (
                                    <option key={budget._id} value={budget._id}>
                                        {budget.budgetName} ({new Date(budget.period.startDate).toLocaleDateString()} - {new Date(budget.period.endDate).toLocaleDateString()})
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>

                {/* Selected Budget Details and Charts */}
                {selectedBudget ? (
                    <div className="space-y-10">
                        {/* Overall Budget Overview */}
                        <div className="bg-green-50 p-6 rounded-lg shadow-inner">
                            <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">
                                {selectedBudget.budgetName} Overview
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                <div className="bg-white p-5 rounded-lg shadow-md border-b-4 border-green-500">
                                    <p className="text-gray-600 text-sm">Overall Budget</p>
                                    <p className="text-3xl font-bold text-green-800 mt-1">${selectedBudget.overallBudgetAmount?.toFixed(2)}</p>
                                </div>
                                <div className="bg-white p-5 rounded-lg shadow-md border-b-4 border-blue-500">
                                    <p className="text-gray-600 text-sm">Total Allocated</p>
                                    <p className="text-3xl font-bold text-blue-800 mt-1">${selectedBudget.overallAllocatedAmount?.toFixed(2)}</p>
                                </div>
                                <div className="bg-white p-5 rounded-lg shadow-md border-b-4 border-red-500">
                                    <p className="text-gray-600 text-sm">Total Utilized</p>
                                    <p className="text-3xl font-bold text-red-800 mt-1">${selectedBudget.overallUtilizedAmount?.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Overall Budget vs. Allocated vs. Utilized Chart */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Budget Allocation vs. Utilization</h3>
                            {overallData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={overallData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                        <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                                        <Legend />
                                        <Bar dataKey="value" name="Amount" radius={[10, 10, 0, 0]}>
                                            {overallData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-gray-600">No overall budget data to display.</p>
                            )}
                        </div>

                        {/* Category-wise Allocation (Pie Chart) */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Category Allocations</h3>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <PieChart>
                                        <Pie
                                            activeIndex={pieChartActiveIndex}
                                            activeShape={renderActiveShape}
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            onMouseEnter={onPieEnter}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Allocated']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-gray-600">No category allocation data to display.</p>
                            )}
                        </div>

                        {/* Budget Items Allocation vs. Utilization (Bar Chart) */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Budget Item Performance</h3>
                            {budgetItemData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={Math.max(300, budgetItemData.length * 50)}> {/* Dynamic height */}
                                    <BarChart
                                        layout="vertical"
                                        data={budgetItemData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                        <XAxis type="number" tickFormatter={(value) => `$${value.toFixed(2)}`} />
                                        <YAxis type="category" dataKey="name" width={120} tickLine={false} />
                                        <Tooltip formatter={(value, name) => [`$${value.toFixed(2)}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                                        <Legend />
                                        <Bar dataKey="allocated" fill="#8884d8" name="Allocated Amount" radius={[5, 5, 0, 0]} />
                                        <Bar dataKey="utilized" fill="#82ca9d" name="Utilized Amount" radius={[5, 5, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-gray-600">No budget item data to display.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-lg text-gray-700">Please select a budget from the dropdown above to view its report.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BudgetReports;