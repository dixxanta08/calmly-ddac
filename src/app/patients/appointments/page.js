"use client";
import { useState, useEffect } from "react";
import { Modal, Form, Button, message, Spin, Tabs, Select, DatePicker } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { createAppointment, getAppointments, getTherapists, getTimeSlotsForTherapistDate } from "../../../services/apiService";
import AppointmentCard from "./AppointmentCard";
import { getSession } from "next-auth/react";
import dayjs from "dayjs";

export default function Appointments() {
    const [modalVisible, setModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [messageApi, contextHolder] = message.useMessage();



    const [therapists, setTherapists] = useState([]);
    const [slots, setSlots] = useState([]);
    const [appointments, setAppointments] = useState([]);

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


    const therapist_id = Form.useWatch('therapist_id', form);
    const date = Form.useWatch('date', form);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const fetchedAppointments = await getAppointments(loggedInUser?.role, loggedInUser?.id);
                setAppointments(fetchedAppointments);
            } catch (error) {
                console.error("Error fetching appointments:", error);
                messageApi.error({
                    content: "Failed to fetch appointments",
                    duration: 3,
                });
            }
            setLoading(false);
        }
        if (loggedInUser?.role && loggedInUser?.id) {
            fetchAppointments();
        }
    }, [loggedInUser, messageApi]);


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
            const fetchedAppointments = await getAppointments(loggedInUser?.role, loggedInUser?.id);
            setAppointments(fetchedAppointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            messageApi.error({
                content: "Failed to fetch appointments",
                duration: 3,
            });
        }
    }
    useEffect(() => {
        const fetchTherapistsAvailableSlots = async () => {
            if (therapist_id && date) {
                console.log("Fetching time slots for therapist", therapist_id, "and date", date);
                // Fetching time slots for therapist 1744949325170 and date M {$L: 'en', $offset: 345, $u: false, $d: Fri Apr 18 2025 00:00:00 GMT+0545 (Nepal Time), $y: 2025, …}
                try {
                    // format day by excluding timezone
                    const formattedDate = dayjs(date).format('YYYY-MM-DD'); // this will convert based on time zone so instead we will use the following
                    const response = await fetch(`/api/therapists/${therapist_id}?date=${formattedDate}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch time slots');
                    }
                    const data = await response.json();
                    setSlots(data);
                } catch (error) {
                    console.error('Error fetching time slots:', error);
                    messageApi.error('Failed to fetch available time slots');
                }
            }
        };
        console.log("Fetching time slots for therapist", therapist_id, "and date", date);

        fetchTherapistsAvailableSlots();
    }, [therapist_id, date, messageApi]);


    const handleCancel = () => {
        setModalVisible(false);
        form.resetFields();
    };
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const [startTime] = values.slot.split(' - ');

            // Create appointment date time by combining date and time
            const appointmentDateTime = new Date(values.date);
            const [hours, minutes] = startTime.split(':');
            appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const appointment = {
                therapist_id: values.therapist_id,
                therapist_name: therapists.find(t => t.id === values.therapist_id)?.name,
                patient_id: loggedInUser.id,
                patient_name: loggedInUser.name,
                bookedDateTime: new Date().toISOString(),
                appointmentDateTime: appointmentDateTime.toISOString(),
                status: 'upcoming'
            };

            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointment),
            });

            if (!response.ok) {
                throw new Error('Failed to create appointment');
            }

            messageApi.success('Appointment booked successfully');
            setModalVisible(false);
            form.resetFields();
            refetchAppointments();
        } catch (error) {
            console.error('Error booking appointment:', error);
            messageApi.error('Failed to book appointment');
        }
    };


    const items = [
        {
            key: 'upcoming',
            label: 'Upcoming',
            children: <>
                {
                    appointments?.filter(appointment => appointment.status === "upcoming").length > 0 ? appointments?.filter(appointment => appointment.status === "upcoming").map(appointment => (
                        <AppointmentCard appointment={appointment} refetchAppointments={refetchAppointments} messageApi={messageApi} key={`${appointment.appointmentDateTime}  ${appointment.therapist_id} ${appointment.patient_id}`} />
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
                        <AppointmentCard appointment={appointment} refetchAppointments={refetchAppointments} messageApi={messageApi} key={`${appointment.appointmentDateTime}  ${appointment.therapist_id} ${appointment.patient_id}`} />
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
                        <AppointmentCard appointment={appointment} refetchAppointments={refetchAppointments} messageApi={messageApi} key={`${appointment.appointmentDateTime}  ${appointment.therapist_id} ${appointment.patient_id}`} />
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

                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>Add New</Button>

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










