"use client";
// admin dashboard

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, List, Typography, Divider, Empty } from "antd";
import { Pie } from "@ant-design/plots"; // Ant Design Pie chart
import { FileTextOutlined } from "@ant-design/icons";
import { getDashboard } from "@/services/apiService";
import { getSession } from "next-auth/react";

const { Title } = Typography;

const PatientDashboard = () => {

    const [loggedInUser, setLoggedInUser] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch session on component mount
    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            setLoggedInUser(session?.user);  // Store the logged-in user in state
            console.log("Session", session);
        };

        fetchSession();
    }, []);

    // Fetch dashboard data when loggedInUser is set
    useEffect(() => {
        const fetchData = async () => {
            if (!loggedInUser) return; // Make sure loggedInUser exists

            try {
                console.log("Fetching dashboard data for user:", loggedInUser);
                const data = await getDashboard(loggedInUser.role, loggedInUser.id);
                setDashboardData(data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
            setLoading(false);
        };

        console.log("loggedInUser", loggedInUser)
        if (loggedInUser && loggedInUser.role === "patient") {
            setLoading(true);
            fetchData();
        }
    }, [loggedInUser]);



    const { upcomingAppointments, pastAppointments, cancelledAppointments, therapists, educationalMaterials } = dashboardData || {};

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

    if (loading) {
        return <div>Loading...</div>; // Show a loading state while fetching data
    }
    return (
        <div className="container mx-auto p-6">

            <h1 className="text-xl font-semibold text-black mb-4">Dashboard</h1>
            {/* First Row: Statistics Boxes */}
            <Row gutter={16}>
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
                            title="Cancelled Appointments"
                            value={cancelledAppointments}
                            suffix="appointments"
                            precision={0}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Educational Materials"
                            value={educationalMaterials?.length}
                            suffix="materials"
                            precision={0}
                        />
                    </Card>
                </Col>
            </Row>

            <h1 className="text-lg font-semibold text-gray-700 mt-8 mb-4">Therapists</h1>
            <Row gutter={16}>
                {therapists?.slice(0, 4).map((therapist, index) => (
                    <Col span={8} key={index}>
                        <Card title={therapist.name}>
                            <p>Phone: {therapist.phone}</p>
                            <p>Email: {therapist.email}</p>
                            <p>Role: {therapist.role}</p>
                        </Card>
                    </Col>
                ))}
            </Row>
            <h1 className="text-lg font-semibold text-gray-700 mt-8 mb-4">Educational Materials</h1>
            <Row gutter={16}>
                {educationalMaterials?.slice(0, 4).map((material, index) => (
                    <Col span={8} key={index}>
                        <Card title={material.name}>
                            <p>Description: {material.description}</p>
                            <p>Uploaded By: {material.uploadedBy}</p>
                            <p>Tags: {material.tags.join(", ")}</p>
                            <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">Download</a>
                        </Card>
                    </Col>
                ))}
            </Row>

        </div>
    );
};

export default PatientDashboard;
