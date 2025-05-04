const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { authenticate } = require('../middleware/auth');

/**
 * @route POST /api/pdf/business-overview
 * @desc Generate a business overview PDF
 * @access Private
 */
router.post('/business-overview', authenticate, pdfController.generateBusinessOverview);

/**
 * @route GET /api/pdf/view/:filename
 * @desc View a generated PDF
 * @access Private
 */
router.get('/view/:filename', authenticate, pdfController.viewPDF);

module.exports = router; 