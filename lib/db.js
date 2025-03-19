import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    process.env.NEXT_PUBLIC_DATABASE_NAME,
    process.env.NEXT_PUBLIC_DATABASE_USER,
    process.env.NEXT_PUBLIC_DATABASE_PASSWORD,
    {
        host: process.env.NEXT_PUBLIC_DATABASE_HOST,
        dialect: 'mysql',
        dialectModule: require('mysql2'),
        port: process.env.NEXT_PUBLIC_DATABASE_PORT || 3306,
    }
);

(async () => {
    try {
        await sequelize.sync({ alter: false });
        console.log('Database synced successfully');
    } catch (error) {
        console.error('Failed to sync database:', error);
    }
})();

export default sequelize;