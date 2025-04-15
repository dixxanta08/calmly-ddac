const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    development: {
        username: process.env.NEXT_PUBLIC_DATABASE_USER,
        password: process.env.NEXT_PUBLIC_DATABASE_PASSWORD,
        database: process.env.NEXT_PUBLIC_DATABASE_NAME,
        host: process.env.NEXT_PUBLIC_DATABASE_HOST,
        dialect: 'mysql',
        port: process.env.NEXT_PUBLIC_DATABASE_PORT || 3306,
    },
};
