var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'rds-gargamel-sites-prod.cz90w43ecjvi.us-east-2.rds.amazonaws.com',
    user: 'admin',
    password: 'tgF9bwFS776CVCqWXnuv',
    database: 'cctool_db',
    insecureAuth: true
});

pool.getConnection((err, connection) => {
    
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
    }

    if(connection) connection.release();

    return;

});

module.exports = pool;
