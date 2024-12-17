const mysql = require('mysql2/promise');
const config = require('../config/database');

async function up() {
  try {
    const connection = await mysql.createConnection(config);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('Activity logs table created successfully');
    await connection.end();
  } catch (error) {
    console.error('Error creating activity_logs table:', error);
    throw error;
  }
}

async function down() {
  try {
    const connection = await mysql.createConnection(config);
    await connection.execute('DROP TABLE IF EXISTS activity_logs');
    console.log('Activity logs table dropped successfully');
    await connection.end();
  } catch (error) {
    console.error('Error dropping activity_logs table:', error);
    throw error;
  }
}

module.exports = { up, down };