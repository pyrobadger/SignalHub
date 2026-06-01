const express = require('express');
const signalController = require('../controllers/signalController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createSignalSchema,
  updateSignalSchema,
  signalIdParamSchema
} = require('../validators/signalValidator');

const router = express.Router();

// Apply JWT authentication middleware to all Signal routes
router.use(authenticate);

router.post('/', validate(createSignalSchema), signalController.createSignal);
router.get('/', signalController.getSignals);
router.get('/:id', validate(signalIdParamSchema), signalController.getSignalById);
router.put('/:id', validate(updateSignalSchema), signalController.updateSignal);
router.delete('/:id', validate(signalIdParamSchema), signalController.deleteSignal);

module.exports = router;
