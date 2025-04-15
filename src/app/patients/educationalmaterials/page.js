"use client";

import { useEffect, useState } from "react";
import { getEducationalMaterials } from "@/services/apiService";
import { Spin, Card, Row, Col, Tag } from "antd";

export default function EducationalMaterials() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const data = await getEducationalMaterials(); // Fetch data from API
                setMaterials(data);
            } catch (error) {
                console.error("Error fetching educational materials:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    // Handle card click to open URL in a new tab
    const handleCardClick = (fileUrl) => {
        if (fileUrl) {
            window.open(fileUrl, "_blank");
        }
    };

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
                <h1 className="text-xl font-semibold text-black">Educational Materials</h1>
            </div>

            {materials?.length === 0 && (
                <div className="text-center mt-6">
                    <h2 className="text-lg font-medium text-gray-800">No educational materials found.</h2>
                </div>
            )}

            {/* Educational Material Cards */}
            <Row gutter={[16, 16]}>
                {materials.map((material) => (
                    <Col key={material.id} span={8}>
                        <Card
                            hoverable
                            className="shadow-lg rounded-lg"
                            onClick={() => handleCardClick(material.fileUrl)}
                        >
                            <h2 className="text-lg font-medium text-black">{material.name}</h2>
                            <p className="text-gray-700 mt-2">{material.description}</p>
                            <p className="text-gray-500 mt-2">
                                <strong>Uploaded by:</strong> {material.uploadedBy}
                            </p>
                            <div className="mt-2">
                                {material.tags?.map((tag) => (
                                    <Tag key={tag} color="blue">{tag}</Tag>
                                ))}
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
