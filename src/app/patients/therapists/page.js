"use client";

import { useEffect, useState } from "react";
import { getTherapists } from "@/services/apiService";
import { Spin, Card, Button, Row, Col } from "antd";
import { PlusOutlined } from "@ant-design/icons";

export default function Therapists() {

    const loggedInUser = { id: "12121", name: "John Doe", role: "patient" };
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTherapists = async () => {
            try {
                const data = await getTherapists(); // Fetch data from API
                setTherapists(data);
            } catch (error) {
                console.error("Error fetching therapists:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTherapists();
    }, []);


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Spin size="large" />
            </div>
        );
    }

    return (

        <div className="p-6 bg-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold text-black">Therapists</h1>

            </div>

            {/* Therapist Cards */}
            <Row gutter={[16, 16]}>
                {therapists.map((therapist) => (
                    <Col key={therapist.id} span={8}>
                        <Card
                            hoverable
                            cover={
                                <img
                                    alt={therapist.name}
                                    src={therapist.imageUrl || "/profile.png"}
                                    className="h-40 object-cover"
                                />
                            }
                            className="shadow-lg rounded-lg"
                        >
                            <Card.Meta
                                title={therapist.name}
                                description={
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-700">
                                            📞 {therapist.phone}
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            ✉️ {therapist.email}
                                        </p>
                                    </div>
                                }
                            />
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>

    );
}
