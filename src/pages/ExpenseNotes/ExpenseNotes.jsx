"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader2, Trash2, Pencil, PlusCircle } from "lucide-react";
import { toast } from "react-toastify";

export default function ExpenseNotes() {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [addModalOpen, setAddModalOpen] = useState(false);

    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [formData, setFormData] = useState({
        date: today,
        particulars: "",
        debit: "",
        credit: "",
        notes: "",
    });

    // Fetch data
    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/transaction-notes`);
            if (res.status === 200 && res.data.success) {
                // keep order with newest first if backend doesn't already sort
                const txns = Array.isArray(res.data.data) ? res.data.data.slice().reverse() : [];
                setTransactions(txns);
            }
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Add Transaction: input mutual-exclusion logic included
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "debit") {
            setFormData({ ...formData, debit: value, credit: "" });
        } else if (name === "credit") {
            setFormData({ ...formData, credit: value, debit: "" });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!formData.debit && !formData.credit) {
            toast.error("⚠️ Please enter either Debit or Credit amount.");
            return;
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/transaction-notes`, formData);

            if (res.status === 201 || res.status === 200) {
                toast.success("✅ Transaction added successfully!");

                // Try to use returned inserted transaction, fallback to response.data
                const newTxn =
                    (res.data && (res.data.newTransaction || res.data.transaction || res.data.data)) ||
                    null;

                // If backend didn't return inserted doc, fetch latest list
                if (newTxn && newTxn._id) {
                    // add to top
                    setTransactions((prev) => [newTxn, ...prev]);
                } else {
                    // fallback: re-fetch
                    fetchTransactions();
                }

                // Reset form and close
                setFormData({ date: today, particulars: "", debit: "", credit: "", notes: "" });
                setAddModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("❌ Failed to add transaction!");
        }
    };

    // Delete
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this transaction?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/transaction-notes/${id}`);
            setTransactions((prev) => prev.filter((txn) => txn._id !== id));
            toast.success("🗑 Transaction deleted!");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("❌ Failed to delete transaction!");
        }
    };

    // Edit
    const handleEdit = (txn) => {
        setCurrentTransaction({ ...txn });
        setEditModalOpen(true);
    };

    const handleUpdate = async () => {
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/api/transaction-notes/${currentTransaction._id}`,
                currentTransaction
            );
            if (res.status === 200) {
                const updated = res.data?.updatedTransaction || currentTransaction;
                setTransactions((prev) =>
                    prev.map((txn) => (txn._id === currentTransaction._id ? updated : txn))
                );
                setEditModalOpen(false);
                toast.success("✏️ Transaction updated!");
            }
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("❌ Failed to update transaction!");
        }
    };

    // open add modal and reset date to today
    const openAddModal = () => {
        setFormData({ date: today, particulars: "", debit: "", credit: "", notes: "" });
        setAddModalOpen(true);
    };

    // small helper to format numbers (safe)
    const formatNumber = (n) => {
        if (n === undefined || n === null || n === "") return "-";
        const num = Number(n);
        if (Number.isNaN(num)) return "-";
        return num.toLocaleString();
    };

    return (
        <div className="max-w-4xl mx-auto mt-6 bg-white shadow-lg rounded-2xl p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">Transaction History</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto justify-center"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span className="text-sm">Add Transaction</span>
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading transactions...</span>
                </div>
            ) : transactions.length === 0 ? (
                <p className="text-center text-gray-500">No transactions found</p>
            ) : (
                <>
                    {/* Table for md+ */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full border-collapse text-sm sm:text-base">
                            <thead>
                                <tr className="bg-gray-100 text-gray-700">
                                    <th className="px-3 py-2 text-left">Date</th>
                                    <th className="px-3 py-2 text-left">Particulars</th>
                                    <th className="px-3 py-2 text-right">Debit (৳)</th>
                                    <th className="px-3 py-2 text-right">Credit (৳)</th>
                                    <th className="px-3 py-2 text-right">Balance (৳)</th>
                                    <th className="px-3 py-2 text-left">Notes</th>
                                    <th className="px-3 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions?.map((txn) => (
                                    <tr key={txn._id} className="border-b hover:bg-gray-50 transition">
                                        <td className="px-3 py-2">{txn.date}</td>
                                        <td className="px-3 py-2">{txn.particulars}</td>
                                        <td className="px-3 py-2 text-right text-red-600">
                                            {txn.debit > 0 ? formatNumber(txn.debit) : "-"}
                                        </td>
                                        <td className="px-3 py-2 text-right text-green-600">
                                            {txn.credit > 0 ? formatNumber(txn.credit) : "-"}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold">
                                            {formatNumber(txn.balance)}
                                        </td>
                                        <td className="px-3 py-2">{txn.notes || "-"}</td>
                                        <td className="px-3 py-2 text-center space-x-2">
                                            <button onClick={() => handleEdit(txn)} className="p-1 rounded hover:bg-blue-100">
                                                <Pencil className="w-4 h-4 text-blue-600" />
                                            </button>
                                            <button onClick={() => handleDelete(txn._id)} className="p-1 rounded hover:bg-red-100">
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile list/cards for small screens */}
                    <div className="md:hidden space-y-2">
                        {transactions?.map((txn) => (
                            <div
                                key={txn._id}
                                className="bg-white border rounded-lg shadow-sm px-2 py-1.5 flex flex-col gap-1"
                            >
                                {/* Top Row: Date + Particulars + Balance + Actions */}
                                <div className="flex justify-between items-center flex-wrap">
                                    <div className="flex items-center flex-wrap text-xs text-gray-500">
                                        <span>{txn.date}</span>
                                        <span className="mx-1">||</span>
                                        <span className="text-sm font-medium text-gray-800 truncate">
                                            {txn.particulars}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span className="text-xs font-semibold text-gray-700">
                                            Bal: {formatNumber(txn.balance)}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(txn)}
                                            className="p-1 rounded hover:bg-blue-100"
                                            aria-label="Edit"
                                        >
                                            <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(txn._id)}
                                            className="p-1 rounded hover:bg-red-100"
                                            aria-label="Delete"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                        </button>
                                    </div>
                                </div>

                                {/* Debit & Credit Row */}
                                <div className="text-xs text-gray-700">
                                    <span>
                                        Debit:{" "}
                                        <span className="text-red-600 font-medium">
                                            {txn.debit > 0 ? formatNumber(txn.debit) : "-"}
                                        </span>
                                    </span>
                                    <span className="mx-1 text-gray-400">||</span>
                                    <span>
                                        Credit:{" "}
                                        <span className="text-green-600 font-medium">
                                            {txn.credit > 0 ? formatNumber(txn.credit) : "-"}
                                        </span>
                                    </span>
                                </div>

                                {/* Notes (only if present) */}
                                {txn.notes && (
                                    <div className="text-[11px] text-gray-500 truncate">
                                        📝 {txn.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                </>
            )}

            {/* Add Modal */}
            {addModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4"
                    onClick={() => setAddModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-xl shadow-lg p-4 w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4">Add New Transaction</h3>
                        <form onSubmit={handleAdd} className="space-y-3">
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="w-full border p-2 rounded"
                            />
                            <input
                                type="text"
                                name="particulars"
                                placeholder="Particulars"
                                value={formData.particulars}
                                onChange={handleChange}
                                required
                                className="w-full border p-2 rounded"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    name="debit"
                                    placeholder="Debit"
                                    value={formData.debit}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                                <input
                                    type="number"
                                    name="credit"
                                    placeholder="Credit"
                                    value={formData.credit}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <textarea
                                name="notes"
                                placeholder="Notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full border p-2 rounded"
                            ></textarea>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setAddModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModalOpen && currentTransaction && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4"
                    onClick={() => setEditModalOpen(false)}
                >
                    <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>

                        <div className="space-y-3">
                            <input
                                type="date"
                                value={currentTransaction.date}
                                onChange={(e) => setCurrentTransaction({ ...currentTransaction, date: e.target.value })}
                                className="w-full border p-2 rounded"
                            />
                            <input
                                type="text"
                                value={currentTransaction.particulars}
                                onChange={(e) => setCurrentTransaction({ ...currentTransaction, particulars: e.target.value })}
                                className="w-full border p-2 rounded"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    value={currentTransaction.debit || ""}
                                    onChange={(e) =>
                                        setCurrentTransaction({ ...currentTransaction, debit: e.target.value, credit: "" })
                                    }
                                    placeholder="Debit"
                                    className="w-full border p-2 rounded"
                                />
                                <input
                                    type="number"
                                    value={currentTransaction.credit || ""}
                                    onChange={(e) =>
                                        setCurrentTransaction({ ...currentTransaction, credit: e.target.value, debit: "" })
                                    }
                                    placeholder="Credit"
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <textarea
                                value={currentTransaction.notes || ""}
                                onChange={(e) => setCurrentTransaction({ ...currentTransaction, notes: e.target.value })}
                                placeholder="Notes"
                                className="w-full border p-2 rounded"
                            ></textarea>
                        </div>

                        <div className="flex justify-end mt-4 space-x-3">
                            <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                                Cancel
                            </button>
                            <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
