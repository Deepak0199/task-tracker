const { body } = require('express-validator');

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
  body('organizationName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Organization name is required'),
  body('organizationDomain')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Organization domain is required')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Task title is required'),
  body('teamId')
    .isMongoId()
    .withMessage('Valid team ID is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be low, medium, high, or critical'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'done'])
    .withMessage('Status must be todo, in-progress, review, or done')
];

const validateTeam = [
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Team name is required'),
  body('description')
    .optional()
    .trim()
];

module.exports = {
  validateRegister,
  validateLogin,
  validateTask,
  validateTeam
};