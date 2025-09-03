const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use the connection string from your MongoDB Atlas or VS Code extension
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://dksingh0199_db_user:Vjg2a8LzMUGUwxqs@datadb.tlkfqms.mongodb.net/', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;