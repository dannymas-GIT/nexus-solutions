const pdfGenerator = require('../services/pdf_generator');
const fs = require('fs');
const path = require('path');

/**
 * Controller for PDF generation
 */
class PDFController {
  /**
   * Generate a business overview PDF
   * @param {Object} req - The request object
   * @param {Object} res - The response object
   */
  async generateBusinessOverview(req, res) {
    try {
      // Validate request
      if (!req.body || !req.body.businessData) {
        return res.status(400).json({ error: 'Business data is required' });
      }

      const businessData = req.body.businessData;
      
      // Validate required fields
      if (!businessData.business_name) {
        return res.status(400).json({ error: 'Business name is required' });
      }

      // Generate the PDF
      const pdfPath = await pdfGenerator.generateBusinessOverview(businessData);
      
      // Get the filename from the path
      const filename = path.basename(pdfPath);
      
      // Set the appropriate headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
      
      // Handle errors in the stream
      fileStream.on('error', (error) => {
        console.error('Error streaming PDF:', error);
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming PDF' });
        }
      });
    } catch (error) {
      console.error('Error generating business overview PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
  
  /**
   * View a generated PDF file
   * @param {Object} req - The request object
   * @param {Object} res - The response object
   */
  async viewPDF(req, res) {
    try {
      const { filename } = req.params;
      
      // Validate filename to prevent directory traversal
      if (!filename || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid filename' });
      }
      
      const pdfPath = path.join(process.cwd(), 'data', 'generated', 'pdf', filename);
      
      // Check if file exists
      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ error: 'PDF not found' });
      }
      
      // Set content type
      res.setHeader('Content-Type', 'application/pdf');
      
      // Stream the file
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
      
      // Handle errors in the stream
      fileStream.on('error', (error) => {
        console.error('Error streaming PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming PDF' });
        }
      });
    } catch (error) {
      console.error('Error viewing PDF:', error);
      res.status(500).json({ error: 'Failed to view PDF' });
    }
  }
}

module.exports = new PDFController(); 