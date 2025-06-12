import React, { useEffect, useState } from 'react';
import { fetchTransactions, deleteTransaction } from '../../api/budgetService';
import { useNavigate, useParams } from 'react-router';

function TransactionList() {
    const { budgetId } = useParams();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchTransactions(budgetId);
            setTransactions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (budgetId) {
            loadTransactions();
        }
    }, [budgetId]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            try {
                setLoading(true);
                setError(null);
                await deleteTransaction(id);
                alert('Transaction deleted successfully!');
                loadTransactions(); // Refresh list to reflect changes
            } catch (err) {
                alert(`Error deleting transaction: ${err.message}`);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) return <p className="text-center py-4 text-gray-600">Loading transactions...</p>;
    if (error) return <p className="text-center text-red-600 py-4 font-medium">Error: {error}</p>;

    return (
        <div className="mt-4">
            {transactions.length === 0 ? (
                <>
                    <p className="text-gray-600 text-center py-4">No transactions recorded for this budget yet.</p>
                </>
            ) : (
                <ul className="space-y-3">
                    {transactions.map(txn => (
                        <li key={txn._id.$oid || txn._id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="mb-2 sm:mb-0 text-sm">
                                <strong className="text-gray-800 text-base">{txn.itemName}</strong> - <span className="font-bold text-red-600 text-base">${txn.amount.toFixed(2)}</span>
                                <p className="text-gray-600 mt-1">
                                    Date: <span className="font-medium">{new Date(txn.transactionDate).toLocaleDateString()}</span>
                                </p>
                                <p className="text-gray-600">
                                    Category: <span className="font-medium">{txn.categoryId}</span>
                                    {txn.subcategoryId && <span className="font-medium"> &gt; {txn.subcategoryId}</span>}
                                </p>
                                {/* UPDATED LOGIC FOR PRICE */}
                                <p className="text-gray-600">
                                    Price per unit: <span className="font-medium">
                                        {/* If price is null/undefined, show N/A. Otherwise, show fixed to 2 decimal places */}
                                        {txn.price === null || txn.price === undefined ? 'N/A' : `$${txn.price.toFixed(2)}`}
                                    </span>
                                </p>
                                {/* UPDATED LOGIC FOR QUANTITY */}
                                <p className="text-gray-600">
                                    Quantity: <span className="font-medium">
                                        {/* If quantity is null/undefined, show N/A. Otherwise, show the value directly */}
                                        {txn.quantity === null || txn.quantity === undefined ? 'N/A' : txn.quantity}
                                    </span>
                                </p>
                                <p className="text-gray-600">
                                    Type: <span className="font-medium">{txn.transactionType === null || txn.transactionType === undefined ? 'N/A' : txn.transactionType}</span>
                                </p>
                                {txn.notes && <p className="text-gray-500 italic mt-1">Notes: {txn.notes}</p>}
                                <p className="text-gray-500 text-xs mt-1">
                                    Recorded: {new Date(txn.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(txn._id)}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200 ease-in-out shadow-sm"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button onClick={() => navigate('add-transaction')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200 ease-in-out shadow-sm">Add new transaction</button>
        </div>
    );
}

export default TransactionList;