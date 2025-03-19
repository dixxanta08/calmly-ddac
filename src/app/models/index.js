import User from './User';
import Appointment from './Appointment';
import EducationalMaterial from './EducationalMaterial';


User.hasMany(Appointment, { foreignKey: 'therapist_id' });
User.hasMany(Appointment, { foreignKey: 'patient_id' });
Appointment.belongsTo(User, { as: 'Therapist', foreignKey: 'therapist_id' });
Appointment.belongsTo(User, { as: 'Patient', foreignKey: 'patient_id' });

export { User, Appointment, EducationalMaterial };
