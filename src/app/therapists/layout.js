"use client";

import { Layout, Menu, Input, Avatar, Spin, Popover, Button } from "antd";
import { FaCalendarAlt, FaBook, FaUser, FaCog } from "react-icons/fa";
import { SearchOutlined } from '@ant-design/icons';
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const { Sider, Content } = Layout;

// SNS functions
async function checkSubscriptions(email) {
    try {
        const response = await fetch(`/api/sns?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        return data.isSubscribed;
    } catch (error) {
        console.error('Error checking subscription:', error);
        return false;
    }
}

async function addSubscription(email) {
    try {
        const response = await fetch('/api/sns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error adding subscription:', error);
        return false;
    }
}
export default function PatientLayout({ children }) {
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [emailSubscribed, setEmailSubscribed] = useState(false);
    const router = useRouter();

    useEffect(() => {

        setTimeout(async () => {

            const session = await getSession();
            setLoggedInUser(session?.user);
            setLoading(false);
            const isSubscribed = await checkSubscriptions(session?.user?.email);
            console.log(isSubscribed);
            setEmailSubscribed(isSubscribed);
        }, 500);
    }, []);

    // Define menu items in an array
    const menuItems = [
        {
            key: "1",
            icon: <FaUser size={18} />,
            label: <Link href="/therapists/dashboard">Dashboard</Link>,
        },
        {
            key: "2",
            icon: <FaCalendarAlt size={18} />,
            label: <Link href="/therapists/appointments">Appointments</Link>,
        },
        {
            key: "3",
            icon: <FaBook size={18} />,
            label: <Link href="/therapists/educationalmaterials">Educational Materials</Link>,
        },

    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Spin size="large" />
            </div>
        );
    }

    if (!loggedInUser) {
        return router.push("/auth/login");
    }
    return (
        <Layout className="!min-h-screen">
            {/* Sidebar */}
            <Sider className="!bg-white p-4" width={250} theme="light" collapsedWidth="0" breakpoint="lg">
                <div className="text-center mb-6 w-full">
                    <h2 className="w-16 h-8 text-[#218551] text-3xl font-semibold text-center ">Calmly</h2>
                </div>

                {/* Updated Menu with a simple white theme */}
                <Menu
                    theme="light"
                    mode="inline"
                    defaultSelectedKeys={['1']}
                    items={menuItems}
                    className="!bg-none"
                />


            </Sider>

            {/* Main Content Area */}
            <Layout className="site-layout">
                {!emailSubscribed ? <div className="w-full p-4 bg-amber-200 text-black flex justify-between items-center">
                    {/* banner for email subscription */}

                    <p>
                        Please subscribe to our email notifications to receive updates and reminders.</p>
                    <Button type="default" variant="outlined" onClick={async () => {
                        try {
                            const isSuccess = await addSubscription(loggedInUser?.email);
                            if (isSuccess) {
                                messageApi.success('Subscription email sent successfully. Check your email.');
                                setEmailSubscribed(true);
                            } else {
                                messageApi.error('Failed to send subscription email. Please try again.');
                            }
                        } catch (error) {
                            messageApi.error('Failed to send subscription email. Please try again.');
                        }
                    }}>Send Subscription Email</Button>
                </div> : null}
                <Content className="p-6 bg-white min-h-screen">
                    <div className="flex justify-end items-center mb-6">
                        {/* <h1 className="text-xl font-semibold text-black">Patient Dashboard</h1> */}
                        <div className="flex items-center gap-4" >

                            <Popover content={
                                <>
                                    <Link href="/therapists/profile" className="block p-2 hover:bg-gray-100">Profile </Link>
                                    <Link href="/auth/logout" className="block p-2 !text-red-600">
                                        Logout
                                    </Link>
                                </>} >
                                <Avatar src={loggedInUser?.imageUrl} /></Popover>
                            <span className="font-semibold text-black">{loggedInUser?.name}</span>
                        </div>
                    </div>

                    {/* Render children content here */}
                    <div className="bg-white p-4 rounded-lg shadow-md">{children}</div>
                </Content>
            </Layout >
        </Layout >
    );
}
