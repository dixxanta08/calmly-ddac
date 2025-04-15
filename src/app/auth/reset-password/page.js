"use client";

import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { Button, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const router = useRouter();

    const handleSubmit = async (values) => {
        const { email, password } = values;

        // Here you would make a request to your backend to reset the password
        // Assuming a simple API call like this:
        const response = await fetch('/api/auth/reset-password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (result.error) {
            messageApi.error(result.error);
        } else {
            messageApi.success("Password reset successful!");
            router.push('/auth/login');  // Redirect to login page after resetting password
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            {contextHolder}
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Reset Password</h1>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ email: "", password: "" }}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Please input your email!" },
                            { type: "email", message: "Invalid email format!" },
                        ]}
                    >
                        <Input placeholder="Enter your email" />
                    </Form.Item>

                    <Form.Item
                        label="New Password"
                        name="password"
                        rules={[{ required: true, message: "Please input your new password!" }]}
                    >
                        <Input.Password placeholder="Enter new password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
                <Link href="/auth/login" className="text-blue-600">
                    Remembered your password? Login
                </Link>
            </div>
        </div>
    );
}
