import {
  Button,
  Modal,
  Input,
  DatePicker,
  Select,
  message,
  Popover,
  Form,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone"; // Import the timezone plugin

import {
  cancelAppointment,
  getTimeSlotsForTherapistDate,
  rescheduleAppointment,
  updateAppointment,
} from "../../../services/apiService";

// Extend dayjs to use UTC and timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const AppointmentCard = ({ appointment, messageApi, refetchAppointments }) => {
  const loggedInUser = { id: "12121", name: "John Doe" };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");

  const [isRescheduled, setIsRescheduled] = useState(
    appointment.isRescheduled || false
  );

  const [form] = Form.useForm();
  const [slots, setSlots] = useState([]);
  const date = Form.useWatch(["date"], form);
  const therapist_id = Form.useWatch(["therapist_id"], form);

  useEffect(() => {
    const fetchTherapistsAvailableSlots = async () => {
      if (appointment && date) {
        try {
          // Format the date to YYYY-MM-DD without timezone conversion
          const formattedDate = date.format("YYYY-MM-DD");
          console.log(
            "Fetching time slots for therapist",
            appointment.therapist_id,
            "and date",
            formattedDate
          );

          const response = await fetch(
            `/api/therapists/${appointment.therapist_id}?date=${formattedDate}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch time slots");
          }
          const data = await response.json();
          setSlots(data);
        } catch (error) {
          console.error("Error fetching time slots:", error);
          messageApi.error("Failed to fetch available time slots");
        }
      }
    };

    fetchTherapistsAvailableSlots();
  }, [appointment, date, messageApi]);

  // Use local time without UTC conversion
  const appointmentTime = dayjs(appointment.appointmentDateTime);
  const formattedAppointmentTime = appointmentTime.format(
    "dddd, MMMM D, YYYY h:mm A"
  );
  const currentTime = dayjs();

  const isStartingSoon =
    appointmentTime.diff(currentTime, "minute") >= 0 &&
    appointmentTime.diff(currentTime, "minute") < 15;
  // after 60 minutes
  const hasStarted = appointmentTime.diff(currentTime, "minute") < 0;
  const isPast = appointmentTime.diff(currentTime, "minute") < -60;

  const isRescheduleAllowed = appointmentTime.diff(currentTime, "minute") > 15;

  const handleCancel = async () => {
    try {
      const formValues = form.getFieldsValue();

      await updateAppointment({
        appointmentId: appointment.appointmentId,
        status: "cancelled",
        cancelledReason: formValues.reason,
        cancellationDate: new Date().toISOString(),
        cancelledBy: loggedInUser.name,
      });

      messageApi.success({
        content: "Appointment cancelled successfully",
        duration: 3,
      });
      form.resetFields();
      await refetchAppointments();
      setIsModalOpen(false);
    } catch (error) {
      messageApi.error({
        content: "Error cancelling appointment",
        duration: 3,
      });
    }
  };

  const handleReschedule = async () => {
    const formValues = form.getFieldsValue();

    if (!isRescheduleAllowed) {
      messageApi.error({
        content:
          "Rescheduling is only allowed up to 15 minutes before the appointment",
        duration: 4,
      });
      return;
    }
    if (isRescheduled) {
      messageApi.warning({
        content: "This appointment has already been rescheduled once",
        duration: 4,
      });
      return;
    }

    try {
      const [startTime] = formValues.slot.split(" - ");
      const [hours, minutes] = startTime.split(":");

      // Create appointment datetime in Kathmandu time
      const appointmentDateTime = dayjs(formValues.date)
        .hour(parseInt(hours))
        .minute(parseInt(minutes))
        .second(0)
        .subtract(5, "hour")
        .subtract(45, "minute"); // Convert back to UTC for storage

      console.log("New appointment time (UTC):", appointmentDateTime.format());

      await updateAppointment({
        appointmentId: appointment.appointmentId,
        rescheduledReason: formValues.rescheduleReason,
        rescheduledBy: loggedInUser.name,
        rescheduledDateTime: new Date().toISOString(),
        appointmentDateTime: appointmentDateTime.format(),
      });

      messageApi.success({
        content: "Appointment rescheduled successfully",
        duration: 3,
      });
      setIsRescheduled(true);
      setIsModalOpen(false);
      await refetchAppointments();
      form.resetFields();
    } catch (error) {
      console.log("Error rescheduling appointment:", error);
      messageApi.error({
        content: "Error rescheduling appointment",
        duration: 3,
      });
    }
  };
  const handleEnd = async () => {
    try {
      await updateAppointment({
        appointmentId: appointment.appointmentId,
        status: "past",
      });
      messageApi.success("Appointment ended successfully");
      setIsRescheduled(true);
      setIsModalOpen(false);
      await refetchAppointments();
    } catch (error) {
      console.log("Error ending appointment:", error);
      messageApi.error("Error ending appointment");
    }
  };
  const handleFeedback = async () => {
    try {
      const formValues = form.getFieldsValue();

      await updateAppointment({
        appointmentId: appointment.appointmentId,
        feedback: formValues.feedback,
      });

      messageApi.success({
        content: "Feedback submitted successfully",
        duration: 3,
      });
      form.resetFields();
      await refetchAppointments();
      setIsModalOpen(false);
    } catch (error) {
      messageApi.error({
        content: "Error submitting feedback",
        duration: 3,
      });
    }
  };
  const handleMeetingLink = async () => {
    try {
      const formValues = form.getFieldsValue();

      await updateAppointment({
        appointmentId: appointment.appointmentId,
        meetingLink: formValues.meetingLink,
      });

      messageApi.success({
        content: "Meeting link added successfully",
        duration: 3,
      });
      form.resetFields();
      await refetchAppointments();
      setIsModalOpen(false);
    } catch (error) {
      messageApi.error({
        content: "Error adding meeting link",
        duration: 3,
      });
    }
  };
  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
    if (type === "reschedule") {
      // Convert UTC time to Kathmandu time (+5:45)
      const utcTime = dayjs(appointment.appointmentDateTime);
      console.log("Original UTC time:", appointment.appointmentDateTime);

      // Add 5 hours and 45 minutes to convert to Kathmandu time
      const ktmTime = utcTime.add(5, "hour").add(45, "minute");
      console.log("Kathmandu time:", ktmTime.format());

      // Set the date in the form
      form.setFieldValue("date", ktmTime);

      // Create the time slot string (e.g., "15:00 - 16:00")
      const hour = ktmTime.hour();
      const nextHour = (hour + 1) % 24;
      const timeSlot = `${hour.toString().padStart(2, "0")}:00 - ${nextHour
        .toString()
        .padStart(2, "0")}:00`;

      console.log("Setting time slot:", timeSlot);
      form.setFieldValue("slot", timeSlot);
    }
  };
  console.log(appointment);
  console.log("isStartingSoon", isStartingSoon);
  console.log("isPast", isPast);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const [startTime] = values.slot.split(" - ");

      // Create appointment date time by combining date and time
      const appointmentDate = values.date.toDate();
      const [hours, minutes] = startTime.split(":");
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const appointment = {
        therapist_id: values.therapist_id,
        therapist_name: therapists.find((t) => t.id === values.therapist_id)
          ?.name,
        patient_id: loggedInUser.id,
        patient_name: loggedInUser.name,
        bookedDateTime: new Date().toISOString(),
        appointmentDateTime: appointmentDate.toISOString(),
        status: "upcoming",
      };

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(appointment),
      });

      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }

      messageApi.success("Appointment booked successfully");
      setModalVisible(false);
      form.resetFields();
      refetchAppointments();
    } catch (error) {
      console.error("Error booking appointment:", error);
      messageApi.error("Failed to book appointment");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm mb-4 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-black">
          {appointment.therapist_name}
        </h2>
        <h2 className="text-gray-500">Patient: {appointment.patient_name}</h2>
        <p className="text-sm text-gray-500">{formattedAppointmentTime}</p>
        {appointment.rescheduledDateTime && (
          <>
            <p className="text-gray-500 ">
              Reschedule Reason:{" "}
              {appointment.rescheduledReason || "No reason provided"}
            </p>
            <p className="text-gray-500 ">
              Rescheduled By: {appointment.rescheduledBy || "No one"}
            </p>
          </>
        )}
        {isStartingSoon && appointment.status === "upcoming" && (
          <p className="text-green-700 text-sm">
            Your appointment is starting shortly. Get ready!
          </p>
        )}
        {isPast && appointment.status === "upcoming" && (
          <p className="text-red-700 text-sm">
            This appointment has already concluded.
          </p>
        )}
      </div>
      <div className="flex space-x-4">
        {appointment.status === "upcoming" &&
          (isStartingSoon || hasStarted) &&
          !isPast &&
          (appointment.meetingLink ? (
            <Button
              type="primary"
              onClick={() => window.open(appointment.meetingLink, "_blank")}
            >
              Join
            </Button>
          ) : (
            <Popover
              content={
                <div>
                  <p className="text-gray-500"> "No meeting link provided"</p>
                </div>
              }
              title="Meeting Link"
            >
              <Button
                type="primary"
                disabled
                onClick={() => window.open(appointment.meetingLink, "_blank")}
              >
                Join
              </Button>
            </Popover>
          ))}
        {appointment.status === "upcoming" &&
          !isStartingSoon &&
          !isPast &&
          !hasStarted &&
          !appointment.rescheduledDateTime && (
            <Button
              variant="outlined"
              onClick={() => {
                form.setFieldValue(
                  "date",
                  dayjs(appointment.appointmentDateTime)
                );
                console.log(
                  "appointment.appointmentDateTime",
                  appointment.appointmentDateTime
                ); //2025-04-19T04:15:00.000Z slot sp we need to add 5+45
                form.setFieldValue(
                  "slot",
                  appointment.appointmentDateTime.split("T")[1].split(":")[0] +
                    ":00 - " +
                    (parseInt(
                      appointment.appointmentDateTime
                        .split("T")[1]
                        .split(":")[0]
                    ) +
                      1) +
                    ":00"
                );

                openModal("reschedule");
              }}
            >
              Reschedule
            </Button>
          )}
        {/* {appointment.status === "upcoming" && isPast && (
          <Button variant="outlined" danger onClick={handleEnd}>
            End Appointment
          </Button>
        )} */}
        {appointment.status === "upcoming" &&
          !isStartingSoon &&
          !hasStarted &&
          !isPast && (
            <Button
              variant="outlined"
              danger
              onClick={() => openModal("cancel")}
            >
              Cancel
            </Button>
          )}
        {appointment.status === "past" && !appointment.feedback && (
          <Button type="primary" onClick={() => openModal("feedback")}>
            Feedback
          </Button>
        )}
        {appointment.status === "past" && appointment.feedback && (
          <Button type="default" onClick={() => openModal("viewFeedback")}>
            View Feedback
          </Button>
        )}
        {appointment.status === "cancelled" && (
          <Button onClick={() => openModal("viewReason")} type="default">
            View Reason
          </Button>
        )}
      </div>

      {/* Modals */}
      <Modal
        title={
          modalType === "cancel"
            ? "Cancel Appointment"
            : modalType === "reschedule"
            ? "Reschedule Appointment"
            : modalType === "feedback"
            ? "Leave Feedback"
            : modalType === "viewFeedback"
            ? "View Feedback"
            : modalType === "viewReason"
            ? "View Cancellation Reason"
            : modalType === "meetingLink"
            ? "Add Meeting Link"
            : ""
        }
        open={isModalOpen}
        onOk={async () => {
          switch (modalType) {
            case "cancel":
              await handleCancel();
              break;

            case "meetingLink":
              await handleMeetingLink();
              break;
            case "reschedule":
              await handleReschedule();
              break;
            case "feedback":
              await handleFeedback();
              break;
            case "viewFeedback":
              setIsModalOpen(false); // No action needed for viewing feedback
              break;
            case "viewReason":
              setIsModalOpen(false); // No action needed for viewing reason
              break;
            default:
              break;
          }
          setIsModalOpen(false);
        }}
        onCancel={() => setIsModalOpen(false)}
      >
        {modalType === "cancel" && (
          <Form layout="vertical" form={form}>
            <Form.Item
              label="Reason"
              name="reason"
              rules={[{ required: true, message: "Please provide a reason!" }]}
            >
              <Input.TextArea rows={3} placeholder="Reason for cancellation" />
            </Form.Item>
          </Form>
        )}
        {modalType === "meetingLink" && (
          <Form
            layout="vertical"
            form={form}
            initialValues={{ meetingLink: appointment.meetingLink }}
          >
            <Form.Item
              label="Meeting Link"
              name="meetingLink"
              rules={[
                { required: true, message: "Please provide a meeting link!" },
              ]}
            >
              <Input placeholder="Meeting link" />
            </Form.Item>
          </Form>
        )}
        {modalType === "reschedule" && (
          <Form layout="vertical" form={form}>
            <Form.Item label="Reschedule Reason" name="rescheduleReason">
              <Input.TextArea rows={3} placeholder="Reason for rescheduling" />
            </Form.Item>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: "Please select a date!" }]}
            >
              <DatePicker />
            </Form.Item>
            <Form.Item
              label="Slot"
              name="slot"
              rules={[{ required: true, message: "Please select a slot!" }]}
            >
              <Select>
                {slots.map((slot) => (
                  <Select.Option
                    key={slot.slot}
                    value={slot.slot}
                    disabled={slot.status !== "available"}
                  >
                    {slot.slot}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
        {modalType === "feedback" && (
          <Form layout="vertical" form={form}>
            <Form.Item
              label="Feedback"
              name="feedback"
              rules={[{ required: true, message: "Please provide feedback!" }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Write your feedback here..."
              />
            </Form.Item>
          </Form>
        )}
        {modalType === "viewFeedback" && (
          <p>{appointment.feedback || "No feedback!"}</p>
        )}
        {modalType === "viewReason" && (
          <>
            <p className="text-gray-500 mt-4">
              <span className="text-black">Cancellation Reason: </span>
              {appointment.cancelledReason || "No reason provided"}
            </p>
            <p className="text-gray-500 mt-2">
              <span className="text-black">Cancelled By: </span>
              {appointment.cancelledBy}
            </p>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AppointmentCard;
