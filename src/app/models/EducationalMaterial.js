// models/Appointment.js
import { DataTypes } from 'sequelize';
import sequelize from "../../../lib/db";

const EducationalMaterial = sequelize.define("EducationalMaterial", {
    materialId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    uploadedBy: {
        type: DataTypes.STRING,
        allowNull: false,

    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
});


export default EducationalMaterial;
