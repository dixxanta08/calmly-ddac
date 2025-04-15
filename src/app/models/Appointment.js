import { DataTypes } from 'sequelize';
import sequelize from "../../../lib/db";

const Appointment = sequelize.define('Appointment', {
    appointmentId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true, // Unique appointment ID
    },
    therapist_id: {
        type: DataTypes.INTEGER,  // Changed to INTEGER to match User's id type
        allowNull: false,
    },
    patient_id: {
        type: DataTypes.INTEGER,  // Changed to INTEGER to match User's id type
        allowNull: false,
    },
    therapist_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    patient_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'upcoming', // Default status is upcoming
    },
    bookedDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    appointmentDateTime: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});

export default Appointment;
