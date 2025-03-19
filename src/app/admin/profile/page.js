"use client";
import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Upload, message, Avatar } from "antd";
import { UploadOutlined, EditOutlined } from "@ant-design/icons";
import { updateUser, uploadFile } from "@/services/apiService";
import { getSession, signIn, useSession } from "next-auth/react";

export default function ProfilePage() {
    const {
        data: session, update } = useSession();

    const [modalVisible, setModalVisible] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            setUser(session?.user);
        };
        fetchSession();
    }, []);

    const handleUpload = async (file) => {
        setUploading(true);
        try {
            const response = await uploadFile(file);
            const fileUrl = response.url;
            messageApi.success("File uploaded successfully");
            return fileUrl;
        } catch (error) {
            messageApi.error("File upload failed");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            const fileObj = values.image?.fileList?.[0]?.originFileObj;
            let imageUrl = user.imageUrl;

            if (fileObj) {
                imageUrl = await handleUpload(fileObj);
                if (!imageUrl) return;
            }

            const updatedUser = { ...user, ...values, imageUrl };
            console.log(updatedUser);

            // Update the user in the database
            await updateUser(updatedUser);

            // Update the user state
            setUser(updatedUser);

            // Show success message
            messageApi.success("Profile updated successfully");


            const response = await signIn("credentials", {
                redirect: false,  // Don't redirect automatically
                email: user.email,
                // password: user.password, // Use saved credentials or use another mechanism to re-fetch
                trigger: "refresh", // Custom trigger
            });

            // Close modal and reset form
            setModalVisible(false);
            form.resetFields();

            // Optionally log the updated user and session for debugging
            console.log(updatedUser);
            // refresh page


        } catch (error) {
            messageApi.error("Failed to update profile");
        }
    };

    return (
        <div className="p-6 bg-white">
            {contextHolder}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-xl font-semibold text-black"> Profile</h1>
                <div className="flex items-center space-x-8">
                    <Button icon={<EditOutlined />} onClick={() => setModalVisible(true)}>
                        Edit Profile
                    </Button>
                </div>
            </div>
            <div className="flex items-center space-x-6">
                <Avatar size={100} src={user?.imageUrl} />
                <div className="ml-4">
                    <h2 className="text-xl font-semibold">{user?.name}</h2>
                    <p>📞 {user?.phone}</p>
                    <p>✉️ {user?.email}</p>
                    <p>🔑 {user?.role}</p>

                </div>
            </div>

            <Modal
                title="Edit Profile"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={user}>
                    <Form.Item name="name" label="Name" rules={[{ required: true, message: "Please enter your name" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Please enter your phone number" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="image" label="Upload Image" valuePropName="file">
                        <Upload beforeUpload={() => false} showUploadList={true} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Upload Image</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={uploading}>Update</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
