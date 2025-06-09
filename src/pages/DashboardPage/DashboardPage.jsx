import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import Dashboard from "../../components/Dashboard";

// const fetchSamplesServer = async () => {
//   try {
//     const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/samples`);
//     return res?.data?.samples || [];
//   } catch (err) {
//     console.error("Server Error: Failed to fetch samples", err);
//     // On the server, you can log errors but can't directly show toast.
//     // The client will get an empty array or handle null/undefined for this data.
//     return [];
//   }
// };

// const fetchDeletedSamplesServer = async () => {
//   try {
//     const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/samples/deleted-samples`);
//     return res?.data?.samples || [];
//   } catch (err) {
//     console.error("Server Error: Failed to fetch deleted samples", err);
//     return [];
//   }
// };


export default function DashboardPage() {
    // Fetch all data concurrently on the server
    //   const [
    //     samples,
    //     takenSamples,
    //     deletedSamples,
    //     categories,
    //     users
    //   ] = await Promise.all([
    //     // fetchSamplesServer(),
    //     // fetchTakenSamplesServer(),
    //     // fetchDeletedSamplesServer(),
    //     fetchCategoriesServer(),
    //     // fetchUsersServer()
    //   ]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchCategories();
        fetchUsers();
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

    return (
        <Dashboard
            categories={categories}
            users={users}
        // initialSamples={samples}
        // initialTakenSamples={takenSamples}
        // initialDeletedSamples={deletedSamples}
        />
    );
}