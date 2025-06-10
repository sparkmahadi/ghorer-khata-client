import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Dashboard from "../../components/Dashboard";


export default function DashboardPage() {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchCategories();
        fetchUsers();
        fetchProducts();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/utilities/categories`);
            console.log(res);
            setCategories(res?.data?.data);
        } catch (err) {
            console.error("Server Error: Failed to fetch categories", err);
            setCategories([]);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users`);
            setUsers(res?.data || []);
        } catch (err) {
            console.error("Server Error: Failed to fetch users", err);
            setUsers([]);
        }
    };
    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/products`);
            setProducts(res?.data || []);
        } catch (err) {
            console.error("Server Error: Failed to fetch users", err);
            setProducts([]);
        }
    };

    return (
        <Dashboard
            categories={categories}
            users={users}
            products={products}
        // initialSamples={samples}
        // initialTakenSamples={takenSamples}
        // initialDeletedSamples={deletedSamples}
        />
    );
}