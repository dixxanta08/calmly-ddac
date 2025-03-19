"use client";

import { getSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const session = await getSession();
            if (session) {
                if (session.user.role === 'admin') {
                    router.push('/admin/dashboard')
                }
                if (session.user.role === 'patient') {
                    router.push('/patients/dashboard')
                }
                if (session.user.role === 'therapist') {
                    router.push('/therapists/dashboard')
                }
            }
        }
        checkUser();
    }, [router])

    const handleSubmit = async (values) => {
        const { email, password } = values;
        const result = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });
        if (result.error) {
            messageApi.error(result.error);
        } else {
            messageApi.success("Login successful!");

            const session = await getSession();
            if (session.user.role === 'admin') {
                router.push('/admin/dashboard')
            }
            if (session.user.role === 'patient') {
                router.push('/patients/dashboard')
            };
            if (session.user.role === 'therapist') {
                router.push('/therapists/dashboard')
            }
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            {contextHolder}
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Login</h1>
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
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: "Please input your password!" }]}
                    >
                        <Input.Password placeholder="Enter your password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Login
                        </Button>
                    </Form.Item>
                </Form>
                <Link href="/auth/register" className="text-blue-600">
                    Don&apos;t have an account? Register
                </Link>
                <br />
                <Link href="/auth/reset-password" className="text-gray-700">
                    Forgot password?
                </Link>
            </div>
        </div>
    );
}
