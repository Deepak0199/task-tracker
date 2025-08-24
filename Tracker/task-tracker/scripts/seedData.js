const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../backend/src/models/User');
const Organization = require('../backend/src/models/Organization');
const Team = require('../backend/src/models/Team');
const Task = require('../backend/src/models/Task');

require('dotenv').config({ path: './backend/.env' });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tasktracker');
    
    console.log('🔄 Clearing existing data...');
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});
    
    console.log('🏢 Creating sample organization...');
    const organization = await Organization.create({
      name: 'Tech Solutions Inc.',
      domain: 'techsolutions',
      plan: 'pro',
      settings: {
        maxTeams: 10,
        maxUsers: 100,
        features: ['time-tracking', 'advanced-analytics', 'custom-fields']
      }
    });

    console.log('👥 Creating sample users...');
    const users = await User.create([
      {
        email: 'admin@techsolutions.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'admin',
        organizationId: organization._id
      },
      {
        email: 'alice@techsolutions.com',
        password: 'password123',
        firstName: 'Alice',
        lastName: 'Johnson',
        role: 'manager',
        organizationId: organization._id
      },
      {
        email: 'bob@techsolutions.com',
        password: 'password123',
        firstName: 'Bob',
        lastName: 'Smith',
        role: 'member',
        organizationId: organization._id
      }
    ]);

    // Update organization owner
    organization.ownerId = users[0]._id;
    await organization.save();

    console.log('🏷️ Creating sample teams...');
    const teams = await Team.create([
      {
        name: 'Frontend Team',
        description: 'Responsible for user interface and experience',
        organizationId: organization._id,
        createdBy: users[0]._id,
        members: [
          { userId: users[1]._id, role: 'lead' },
          { userId: users[2]._id, role: 'member' }
        ]
      },
      {
        name: 'Backend Team',
        description: 'Server-side development and API management',
        organizationId: organization._id,
        createdBy: users[0]._id,
        members: [
          { userId: users[0]._id, role: 'lead' },
          { userId: users[1]._id, role: 'member' }
        ]
      }
    ]);

    // Update users with teams
    await User.findByIdAndUpdate(users[0]._id, { teams: [teams[1]._id] });
    await User.findByIdAndUpdate(users[1]._id, { teams: [teams[0]._id, teams[1]._id] });
    await User.findByIdAndUpdate(users[2]._id, { teams: [teams[0]._id] });

    console.log('📋 Creating sample tasks...');
    await Task.create([
      {
        title: 'Design new user interface',
        description: 'Create mockups and prototypes for the new dashboard',
        status: 'in-progress',
        priority: 'high',
        assignedTo: users[1]._id,
        createdBy: users[0]._id,
        teamId: teams[0]._id,
        organizationId: organization._id,
        dueDate: new Date('2025-08-30'),
        estimatedHours: 20,
        actualHours: 12
      },
      {
        title: 'Implement API endpoints',
        description: 'Create REST API endpoints for task management',
        status: 'todo',
        priority: 'medium',
        assignedTo: users[2]._id,
        createdBy: users[0]._id,
        teamId: teams[1]._id,
        organizationId: organization._id,
        dueDate: new Date('2025-09-05'),
        estimatedHours: 15
      },
      {
        title: 'Setup deployment pipeline',
        description: 'Configure CI/CD with Docker and GitHub Actions',
        status: 'done',
        priority: 'high',
        assignedTo: users[0]._id,
        createdBy: users[0]._id,
        teamId: teams[1]._id,
        organizationId: organization._id,
        dueDate: new Date('2025-08-20'),
        estimatedHours: 8,
        actualHours: 10
      }
    ]);

    console.log('✅ Sample data seeded successfully!');
    console.log('📧 Login credentials:');
    console.log('   Admin: admin@techsolutions.com / password123');
    console.log('   Manager: alice@techsolutions.com / password123');
    console.log('   Member: bob@techsolutions.com / password123');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;