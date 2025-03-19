"use client";

import React, { useState, useEffect } from "react";
import { Table, Button, Input, Modal, Form, Input as AntInput, Space, Popconfirm, message, Select } from "antd";
import { FaSearch, FaPlus } from "react-icons/fa";
import { getUsers, createUser, updateUser, deleteUser } from "@/services/apiService";

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [messageApi, contextHolder] = message.useMessage();


    // Fetch users from the API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const fetchedUsers = await getUsers();
                setUsers(fetchedUsers);
            } catch (error) {
                message.error("Failed to load users");
            }
        };

        fetchUsers();
    }, []);

    // Columns for the Ant Design table
    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space size="middle">
                    <Button onClick={() => handleEdit(record)} type="primary">
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure to delete this user?"
                        onConfirm={() =>

                            handleDelete(record.id)
                        }
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="danger">Delete</Button>
                    </Popconfirm>
                </Space >
            ),
        },
    ];

    // Show Modal to Add/Edit User
    const showModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();

            if (editingUser) {
                // Update user
                const updatedUser = { ...editingUser, ...values };

                try {
                    // Call your update API to update the user on the server
                    await updateUser(updatedUser);
                    // Update the state after successful update
                    setUsers((prevUsers) =>
                        prevUsers.map((user) =>
                            user.id === editingUser.id ? updatedUser : user
                        )
                    );
                    messageApi.success("User updated successfully");
                } catch (error) {
                    // Log the entire error object to check its structure
                    console.error("Error during update:", error);

                    // Check if the error has a response with a message
                    if (error.response && error.response.data && error.response.data.error) {
                        const errorMessage = error.response.data.error;
                        messageApi.error(errorMessage);  // Display backend error (e.g., duplicate email)
                    } else {
                        messageApi.error("Failed to update user");
                    }
                }
            } else {
                // Add new user
                const newUser = { id: Date.now().toString(), ...values };

                try {
                    // Call createUser API to create a user on the server
                    await createUser(newUser);

                    // Refetch the list of users after adding
                    const fetchedUsers = await getUsers();
                    setUsers(fetchedUsers);

                    messageApi.success("User added successfully");

                    setIsModalOpen(false);
                } catch (error) {
                    // Log the entire error object to check its structure
                    console.error("Error during creation:", error);


                    // Check if the error has a response with a message
                    if (error.response && error.response.data && error.response.data.error) {
                        const errorMessage = error.response.data.error;
                        messageApi.error(errorMessage);  // Display backend error (e.g., duplicate email)
                    } else {
                        messageApi.error("Failed to add user");
                    }
                }
            }

        } catch (info) {
            console.log("Validate Failed:", info);
        }
    };

    // Handle Edit
    const handleEdit = (user) => {
        console.log("Edit user:", user);
        setEditingUser(user);
        setIsModalOpen(true);
    };

    // Handle Delete
    const handleDelete = async (id) => {
        try {
            // Call the delete API to delete the user on the server
            await deleteUser(id); // Make sure you have a `deleteUser` function in your `apiService`

            // Remove the deleted user from the local state
            setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));

            messageApi.success("User deleted successfully");
        } catch (error) {
            messageApi.error("Failed to delete user");
        }
    };

    // Filter users based on search term
    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Modal form
    const [form] = Form.useForm();

    return (
        <>
            {contextHolder}
            <div className="p-6 bg-white" >
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-semibold text-black">Users</h1>
                    <div className="flex items-center space-x-8">
                        {/* Search Bar */}
                        <Input.Search placeholder="Search users..." allowClear onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 300 }} />

                        {/* Add User Button */}
                        <Button
                            type="primary"
                            icon={<FaPlus />}
                            onClick={showModal}
                        >
                            Add User
                        </Button>
                    </div>
                </div>

                {/* User Table */}
                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="id"
                    pagination={false}
                />

                {/* Modal for Add/Edit User */}
                <Modal
                    title={editingUser ? "Edit User" : "Add User"}
                    open={isModalOpen}
                    onCancel={handleCancel}
                    onOk={handleOk}
                    destroyOnClose
                >
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={editingUser || { name: "", email: "", role: "" }}
                    >
                        <Form.Item
                            name="name"
                            label="Name"
                            rules={[{ required: true, message: "Please enter the name!" }]}
                        >
                            <AntInput placeholder="Enter name" />
                        </Form.Item>
                        <Form.Item

                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: "Please enter the email!" },
                                { type: "email", message: "Please enter a valid email!" },
                            ]}
                        >
                            <AntInput placeholder="Enter email" disabled={editingUser} />
                        </Form.Item>
                        <Form.Item
                            name="phone"
                            label="Phone"
                            rules={[{ required: true, message: "Please enter the phone number!" }]}
                        >
                            <AntInput placeholder="Enter phone number" />
                        </Form.Item>
                        <Form.Item
                            name="role"
                            label="Role"
                            rules={[{ required: true, message: "Please select the role!" }]}
                        >
                            <Select placeholder="Select role">
                                <Select.Option value="admin">Admin</Select.Option>
                                <Select.Option value="therapist">Therapist</Select.Option>
                                <Select.Option value="patient">Patient</Select.Option>
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
}
