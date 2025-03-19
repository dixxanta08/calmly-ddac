"use client";
// admin dashboard

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, List, Typography, Divider, Empty } from "antd";
import { Pie } from "@ant-design/plots"; // Ant Design Pie chart
import { FileTextOutlined } from "@ant-design/icons";
import { getDashboard } from "@/services/apiService";
import { getSession } from "next-auth/react";

const { Title } = Typography;

const AdminDashboard = () => {


    const [dashboardData, setDashboardData] = useState(null);

    const [loggedInUser, setLoggedInUser] = useState(null);

    // Fetch session on component mount
    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            setLoggedInUser(session?.user);  // Store the logged-in user in state
        };

        fetchSession();
    }, []);

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDashboard(loggedInUser.role, loggedInUser.id);
                setDashboardData(data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };
        if (loggedInUser && loggedInUser.role === "admin") {
            fetchData();
        }
    }, [loggedInUser]);

    if (!dashboardData) {
        return <div>Loading...</div>; // Show a loading state while fetching data
    }

    const { totalPatients, upcomingAppointments, pastAppointments, cancelledAppointments, educationalMaterials } = dashboardData;

    // Pie chart data
    const pieData = [
        {
            type: "Past",
            value: pastAppointments,
        },
        {
            type: "Cancelled",
            value: cancelledAppointments,
        },
    ];
    return (
        <div className="container mx-auto p-6">

            <h1 className="text-xl font-semibold text-black">Dashboard</h1>
            {/* First Row: Statistics Boxes */}
            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Patients"
                            value={totalPatients}
                            suffix="patients"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Upcoming Appointments"
                            value={upcomingAppointments}
                            suffix="appointments"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Past Appointments"
                            value={pastAppointments}
                            suffix="appointments"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Educational Materials"
                            value={educationalMaterials.length}
                            suffix="materials"
                            precision={0}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Second Row: Pie Chart */}
            <Divider />
            <Row gutter={16}>
                <Col span={10}>
                    <Card
                        title="Appointment Status"
                        className="h-full"
                    >
                        <Pie
                            data={pieData}
                            angleField="value"
                            colorField="type"
                            radius={0.8}
                            innerRadius={0.6}
                            statistic={{
                                title: {
                                    style: {
                                        fontSize: "16px",
                                        fontWeight: "bold",
                                        color: "#4a4a4a",
                                    },
                                },
                            }}
                        />
                    </Card>
                </Col>

                {/* Educational Materials List */}
                <Col span={14}>
                    <Card
                        title="Educational Materials"
                        bordered={false}
                        className="h-full"
                        style={{ minHeight: "300px" }} // Fixed height for Educational Materials Card
                    >
                        {educationalMaterials.length > 0 ? <List

                            dataSource={educationalMaterials.slice(0, 3)} // Show max 3 materials
                            renderItem={(item) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<FileTextOutlined />}
                                        title={<a href={item.fileUrl} target="_blank" rel="noopener noreferrer">{item.name}</a>}
                                        description={
                                            <>
                                                <div>{item.description}</div>
                                                <div className="text-sm text-gray-500">{item.tags.join(", ")}</div>
                                            </>
                                        }
                                    />
                                </List.Item>
                            )}
                        /> :
                            <Empty description="No educational materials found." />
                        }
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
