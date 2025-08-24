const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  settings: {
    maxTeams: {
      type: Number,
      default: 5
    },
    maxUsers: {
      type: Number,
      default: 50
    },
    features: [{
      type: String,
      enum: ['time-tracking', 'advanced-analytics', 'custom-fields', 'api-access']
    }]
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Organization', organizationSchema);