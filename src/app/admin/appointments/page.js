"use client";
import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Spin, Tabs, Select, DatePicker } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { createAppointment, getAppointments, getTherapists, getTimeSlotsForTherapistDate } from "../../../services/apiService";
import AppointmentCard from "./AppointmentCard";
import { getSession } from "next-auth/react";

export default function Appointments() {
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [messageApi, contextHolder] = message.useMessage();



    const [therapists, setTherapists] = useState([]);
    const [slots, setSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);


    const therapist_id = Form.useWatch('therapist_id', form);
    const date = Form.useWatch('date', form);
    const [loggedInUser, setLoggedInUser] = useState(null);

    // Fetch session on component mount
    useEffect(() => {
        const fetchSession = async () => {
            const session = await getSession();
            setLoggedInUser(session?.user);  // Store the logged-in user in state
        };

        fetchSession();
    }, []);
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const fetchedAppointments = await getAppointments(loggedInUser.role, loggedInUser.id);
                setAppointments(fetchedAppointments);
            } catch (error) {
                console.error("Error fetching appointments:", error);
                messageApi.error("Failed to fetch appointments");
            }
            setLoading(false);
        }
        if (loggedInUser && loggedInUser.role === "admin") {
            fetchAppointments();
        }
    }, [loggedInUser]);


    useEffect(() => {
        const fetchTherapists = async () => {

            const fetchedTherapists = await getTherapists();
            setTherapists(fetchedTherapists);
        }
        if (modalVisible) {
            fetchTherapists();
        }
    }, [modalVisible]);

    const refetchAppointments = async () => {
        try {
            const fetchedAppointments = await getAppointments(loggedInUser.role, loggedInUser.id);
            setAppointments(fetchedAppointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            messageApi.error("Failed to fetch appointments");
        }
    }
    useEffect(() => {
        const fetchTherapistsAvailableSlots = async () => {
            console.log("Fetching slots for therapist and date", therapist_id, date);
            const fetchedTherapistSlots = await getTimeSlotsForTherapistDate(therapist_id, date);
            setSlots(fetchedTherapistSlots);
        }
        if (therapist_id && date) {
            console.log("Fetching slots for therapist and date", therapist_id, date);
            fetchTherapistsAvailableSlots();
        }
    }, [therapist_id, date]);


    const handleCancel = () => {
        setModalVisible(false);
        form.resetFields();
    };
    const handleOk = async () => {
        try {
            const formValues = form.getFieldsValue();
            const localDate = new Date(formValues.date);
            localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset()); // Adjust to local time

            const appointmentDateTime = localDate.toISOString().split("T")[0] + "T" + formValues.slot.split(" - ")[0] + ":00" +
                "+05:45";


            const appointment = {
                therapist_id: formValues.therapist_id,
                therapist_name: therapists.find(therapist => therapist.id === formValues.therapist_id).name,
                patient_id: loggedInUser.id,
                patient_name: loggedInUser.name,
                status: "upcoming",
                bookedDateTime: new Date().toISOString(),
                appointmentDateTime: appointmentDateTime,
            };
            await createAppointment(appointment);
            setModalVisible(false);
            form.resetFields();
            await refetchAppointments();

        } catch (error) {
            console.log(error);
            messageApi.error("Failed to book appointment");
        }
    };


    const items = [
        {
            key: 'upcoming',
            label: 'Upcoming',
            children: <>
                {
                    appointments?.filter(appointment => appointment.status === "upcoming").length > 0 ? appointments?.filter(appointment => appointment.status === "upcoming").map(appointment => (
                        <AppointmentCard loggedInUser={loggedInUser} appointment={appointment} refetchAppointments={refetchAppointments} messageApi={messageApi} key={`${appointment.appointmentDateTime}  ${appointment.therapist_id} ${appointment.patient_id}`} />
                    )) :
                        <div className="flex justify-center items-center h-40 rounded-lg  ">
                            <p className="text-gray-400 text-lg">No upcoming appointments</p>
                        </div>
                }</>,
        },
        {
            key: 'past',
            label: 'Past',
            children: <>
                {
                    appointments?.filter(appointment => appointment.status === "past").length > 0 ? appointments?.filter(appointment => appointment.status === "past").map(appointment => (
                        <AppointmentCard loggedInUser={loggedInUser} appointment={appointment} refetchAppointments={refetchAppointments} messageApi={messageApi} key={`${appointment.appointmentDateTime}  ${appointment.therapist_id} ${appointment.patient_id}`} />
                    )) :
                        <div className="flex justify-center items-center h-40 rounded-lg ">
                            <p className="text-gray-400 text-lg">No past appointments</p>
                        </div>
                }</>,
        },
        {
            key: 'cancelled',
            label: 'Cancelled',
            children: <>
                {
                    appointments?.filter(appointment => appointment.status === "cancelled").length > 0 ? appointments?.filter(appointment => appointment.status === "cancelled").map(appointment => (
                        <AppointmentCard loggedInUser={loggedInUser} appointment={appointment} refetchAppointments={refetchAppointments} messageApi={messageApi} key={`${appointment.appointmentDateTime}  ${appointment.therapist_id} ${appointment.patient_id}`} />
                    )) :
                        <div className="flex justify-center items-center h-40  rounded-lg ">
                            <p className="text-gray-400 text-lg">No cancelled appointments</p>
                        </div>
                }</>,
        },
    ];
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
                    <h1 className="text-xl font-semibold text-black">  Appointments</h1>
                    <div className="flex items-center space-x-8">
                        {/* <Input.Search placeholder="Search materials..." allowClear onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 300 }} /> */}

                        {/* <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Add New</Button> */}

                    </div>
                </div>

                <Tabs defaultActiveKey="upcoming" items={items} />
                <Modal
                    open={modalVisible}
                    title={"Book Appointment"}
                    onCancel={handleCancel}
                    onOk={handleOk}
                    destroyOnClose
                >
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ therapist_id: "", therapist_name: "", date: "", slot: "" }}
                    >
                        <Form.Item name="therapist_id" label="Therapist" rules={[{ required: true, message: "Please select a therapist!" }]}>
                            <Select>
                                {therapists.map(therapist => (
                                    <Select.Option key={therapist.id} value={therapist.id}>{therapist.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="date" label="Date" rules={[{ required: true, message: "Please select a date!" }]}>
                            <DatePicker />
                        </Form.Item>
                        <Form.Item name="slot" label="Slot" rules={[{ required: true, message: "Please select a slot!" }]}>
                            <Select>
                                {slots.map(slot => (
                                    <Select.Option key={slot.slot} value={slot.slot} disabled={slot.status !== "available"} >{slot.slot}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </>
    );
}







