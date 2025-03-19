"use client";
import { useState, useEffect } from "react";
import { Table, Modal, Form, Input, Button, Upload, Tag, message, Spin } from "antd";
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { createEducationalMaterial, deleteEducationalMaterial, getEducationalMaterials, updateEducationalMaterial, uploadFile } from "../../../services/apiService";
import { getSession } from "next-auth/react";

export default function EducationalMaterialPage() {
    const [materials, setMaterials] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setIsLoading] = useState(true);
    const [messageApi, contextHolder] = message.useMessage();
    const [loggedInUser, setLoggedInUser] = useState(null);


    // Fetch session on component mount
    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            setLoggedInUser(session?.user);  // Store the logged-in user in state
            console.log("Session", session);
        };

        fetchSession();
    }, []);

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const materials = await getEducationalMaterials(loggedInUser?.name);
                setMaterials(materials);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching materials:", error);
                messageApi.error("Failed to fetch materials");
            }
        };
        if (loggedInUser && loggedInUser.role === "therapist") {
            fetchMaterials();
        }
    }, [loggedInUser, messageApi]);




    const handleUpload = async (file) => {
        console.log("Uploading file:", file);
        setUploading(true);
        try {
            const response = await uploadFile(file);
            const fileUrl = response.url;

            messageApi.success(response.message || "File uploaded successfully");
            return fileUrl;
        } catch (error) {
            messageApi.error("File upload failed");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const refetchMaterials = async () => {
        try {
            const materials = await getEducationalMaterials(loggedInUser?.name);
            setMaterials(materials);
        } catch (error) {
            console.error("Error fetching materials:", error);
            messageApi.error("Failed to fetch materials");
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (!editingMaterial && !values.file) {
                messageApi.error("Please upload a file");
                return;
            }
            const fileObj = values.file?.fileList?.[0]?.originFileObj;
            let fileUrl = editingMaterial?.fileUrl;

            if (fileObj) {
                fileUrl = await handleUpload(fileObj);
                if (!fileUrl) {
                    messageApi.error("File upload failed");
                    return;
                }
            }
            const newMaterial = {
                materialId: editingMaterial ? editingMaterial.materialId : Date.now().toString(),
                ...values,
                uploadedBy: loggedInUser.name,
                fileUrl,
                tags: values.tags ? values.tags.split(",").map(tag => tag.trim()) : [],
            };

            if (editingMaterial) {
                // ✅ Update material
                await updateEducationalMaterial(newMaterial);
                messageApi.success("Material updated successfully");
            } else {
                // ✅ Create material
                await createEducationalMaterial(newMaterial);
                messageApi.success("Material added successfully");
            }

            await refetchMaterials();

            setModalVisible(false);
            form.resetFields();
            setEditingMaterial(null);
        } catch (error) {
            console.error("Error submitting material:", error);

            if (error.response) {
                messageApi.error(error.response.data.message || "Failed to save material");
            } else {
                messageApi.error("An unexpected error occurred");
            }
        }
    };

    const handleEdit = (record) => {
        setEditingMaterial(record);
        form.setFieldsValue({ ...record, tags: record.tags.join(", ") });
        setModalVisible(true);
    };

    const handleDelete = async (materialId) => {
        try {
            await deleteEducationalMaterial(materialId);
            messageApi.success("Material deleted successfully");

            await refetchMaterials();

        } catch (error) {
            console.error("Error deleting material:", error);
            messageApi.error("Failed to delete material");
        }
    };

    const filteredMaterials = materials.filter(mat => mat.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            {contextHolder}
            <div className="p-6 bg-white">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-xl font-semibold text-black">  Educational Materials</h1>
                    <div className="flex items-center space-x-8">
                        {/* Search Bar */}
                        <Input.Search placeholder="Search materials..." allowClear onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 300 }} />

                        {/* Add User Button */}
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Add New</Button>

                    </div>
                </div>

                <Table dataSource={filteredMaterials} rowKey="materialId">
                    <Table.Column title="Name" dataIndex="name" key="name" />
                    <Table.Column title="Description" dataIndex="description" key="description" />
                    <Table.Column title="Uploaded By" dataIndex="uploadedBy" key="uploadedBy" />
                    <Table.Column title="Tags" dataIndex="tags" key="tags" render={(tags) => tags.map(tag => <Tag key={tag}>{tag}</Tag>)} />
                    <Table.Column title="Actions" key="actions" render={(text, record) => (
                        <>
                            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} style={{ marginRight: 8 }} />
                            <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.materialId)} />
                        </>
                    )} />
                </Table>

                <Modal
                    title={editingMaterial ? "Edit Material" : "Add New Material"}
                    open={modalVisible}
                    onCancel={() => { setModalVisible(false); form.resetFields(); setEditingMaterial(null); }}
                    footer={null}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please input the name!" }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="description" label="Description" rules={[{ required: true, message: "Please input a description!" }]}>
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item name="tags" label="Tags">
                            <Input placeholder="Comma separated tags" />
                        </Form.Item>
                        <Form.Item name="file" label="Upload File" valuePropName="file">
                            <Upload beforeUpload={() => false} showUploadList={true} maxCount={1}>
                                <Button icon={<UploadOutlined />}>Upload File</Button>
                            </Upload>
                        </Form.Item>
                        {editingMaterial?.fileUrl && (
                            <Form.Item label="Current File">
                                <a href={editingMaterial.fileUrl} target="_blank" rel="noopener noreferrer">Download Current File</a>
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={uploading}>
                                {editingMaterial ? "Update" : "Add"}
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
}
