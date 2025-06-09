import React, { useState, useEffect } from 'react';
import { PlusCircle, Wallet, TrendingUp, DollarSign, Info, X } from 'lucide-react';

// Define a simple custom message box component
const MessageBox = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-500';
  const borderColor = type === 'error' ? 'border-red-700' : 'border-green-700';

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white font-medium flex items-center justify-between z-50 ${bgColor} border-2 ${borderColor}`}>
      <span className="flex items-center">
        <Info size={20} className="mr-2" />
        {message}
      </span>
      <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};

// Main Homepage Component
const App = () => {
  // Hardcoded data for demonstration
  const [totalMonthlyBudget, setTotalMonthlyBudget] = useState(25000); // Example total budget
  const [totalExpensesThisMonth, setTotalExpensesThisMonth] = useState(18500); // Example expenses
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState([
    { id: 'exp1', date: '2025-06-03', category: 'Food - Groceries', item: 'চাল - Miniket Rice', price: 1200 },
    { id: 'exp2', date: '2025-06-02', category: 'Transportation', item: 'বাস ভাড়া', price: 150 },
    { id: 'exp3', date: '2025-06-01', category: 'Food - Guest Entertainment', item: 'Broiler Chicken', price: 350 },
    { id: 'exp4', date: '2025-05-30', category: 'Utilities', item: 'Electricity Bill', price: 1800 },
    { id: 'exp5', date: '2025-05-29', category: 'Education', item: 'Tuition Fee', price: 2500 },
  ]);

  // UI state for messages and loading (simplified as no async ops)
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [loading, setLoading] = useState(false); // No loading as data is hardcoded

  // Calculate remaining budget on initial render and whenever budget/expenses change (though here they are static)
  useEffect(() => {
    setRemainingBudget(totalMonthlyBudget - totalExpensesThisMonth);
  }, [totalMonthlyBudget, totalExpensesThisMonth]);

  const showMessage = (msg, type = 'info', duration = 3000) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), duration);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="ml-4 text-lg text-gray-700">Loading your financial data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 font-inter bg-gray-50 min-h-screen">
      <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

      {/* Header Section */}
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
          Welcome to Your Family Budget!
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Manage your monthly budget and track daily expenses to achieve your financial goals.
        </p>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total Monthly Budget Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl shadow-lg p-6 flex flex-col justify-between transform transition-transform hover:scale-105 duration-300">
          <div className="flex items-center mb-4">
            <Wallet size={32} className="mr-3" />
            <h2 className="text-2xl font-semibold">Total Monthly Budget</h2>
          </div>
          <p className="text-4xl font-bold">৳{totalMonthlyBudget.toLocaleString('en-BD')}</p>
          <p className="text-sm opacity-90 mt-2">Your total allocated funds for the month.</p>
        </div>

        {/* Total Expenses This Month Card */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl shadow-lg p-6 flex flex-col justify-between transform transition-transform hover:scale-105 duration-300">
          <div className="flex items-center mb-4">
            <TrendingUp size={32} className="mr-3" />
            <h2 className="text-2xl font-semibold">Expenses This Month</h2>
          </div>
          <p className="text-4xl font-bold">৳{totalExpensesThisMonth.toLocaleString('en-BD')}</p>
          <p className="text-sm opacity-90 mt-2">Spending recorded so far this month.</p>
        </div>

        {/* Remaining Budget Card */}
        <div className={`rounded-xl shadow-lg p-6 flex flex-col justify-between transform transition-transform hover:scale-105 duration-300
          ${remainingBudget < 0
            ? 'bg-gradient-to-br from-red-600 to-red-800 text-white' // Over budget
            : remainingBudget < totalMonthlyBudget * 0.2 // Less than 20% remaining
            ? 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-white' // Nearing limit
            : 'bg-gradient-to-br from-green-500 to-green-700 text-white' // Healthy budget
          }`}
        >
          <div className="flex items-center mb-4">
            <DollarSign size={32} className="mr-3" />
            <h2 className="text-2xl font-semibold">Remaining Budget</h2>
          </div>
          <p className="text-4xl font-bold">৳{remainingBudget.toLocaleString('en-BD')}</p>
          <p className="text-sm opacity-90 mt-2">Funds available for the rest of the month.</p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Quick Actions</h2>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <PlusCircle size={24} className="mr-2" />
            Log New Expense
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <Wallet size={24} className="mr-2" />
            Set Monthly Budget
          </button>
        </div>
      </section>

      {/* Data Visualizations Placeholder */}
      <section className="mb-10 p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Spending Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-lg p-6 h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
            <p className="text-xl">Pie Chart: Category-wise Spending (Placeholder)</p>
          </div>
          <div className="bg-gray-100 rounded-lg p-6 h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
            <p className="text-xl">Bar Graph: Monthly Spending Trends (Placeholder)</p>
          </div>
        </div>
      </section>

      {/* Recent Transactions Placeholder */}
      <section className="p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Recent Expenses</h2>
        {recentExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                  <th className="py-3 px-6 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Price (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-800">{new Date(expense.date).toLocaleDateString('en-BD')}</td>
                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-800">{expense.category}</td>
                    <td className="py-3 px-6 whitespace-nowrap text-sm text-gray-800">{expense.item}</td>
                    <td className="py-3 px-6 whitespace-nowrap text-right text-sm font-medium text-gray-900">৳{expense.price.toLocaleString('en-BD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg py-10">No recent expenses logged. Start tracking your spending!</p>
        )}
      </section>
    </div>
  );
};

export default App;
