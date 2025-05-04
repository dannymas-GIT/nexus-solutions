const fs = require('fs');
const path = require('path');
const mustache = require('mustache');
const wkhtmltopdf = require('wkhtmltopdf');
const { format } = require('date-fns');
const util = require('util');
const mkdirp = require('mkdirp');
const { v4: uuidv4 } = require('uuid');

// Convert streams to promises
const streamFinished = util.promisify(require('stream').finished);

class PDFGenerator {
  constructor() {
    this.templateDir = path.join(process.cwd(), 'data', 'templates', 'pdf');
    this.outputDir = path.join(process.cwd(), 'data', 'generated', 'pdf');
    
    // Ensure output directory exists
    mkdirp.sync(this.outputDir);
  }

  /**
   * Generate a PDF document from a template and data
   * @param {string} templateName - The template name (without extension)
   * @param {Object} data - The data to render the template with
   * @returns {Promise<string>} - The path to the generated PDF
   */
  async generatePDF(templateName, data) {
    try {
      // Prepare enhanced data with standard fields
      const enhancedData = {
        ...data,
        current_date: format(new Date(), 'MMMM dd, yyyy')
      };

      // Read the template
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      const template = fs.readFileSync(templatePath, 'utf8');

      // Render the template with Mustache
      const renderedHtml = mustache.render(template, enhancedData);

      // Generate a unique filename
      const outputFilename = `${templateName}_${uuidv4()}.pdf`;
      const outputPath = path.join(this.outputDir, outputFilename);

      // Create a write stream
      const outputStream = fs.createWriteStream(outputPath);

      // Generate PDF
      const pdfStream = wkhtmltopdf(renderedHtml, {
        pageSize: 'letter',
        marginTop: '10mm',
        marginBottom: '10mm',
        marginLeft: '10mm',
        marginRight: '10mm',
        disableSmartShrinking: true,
        printMediaType: true,
        enableLocalFileAccess: true
      });

      // Pipe the PDF to the file
      pdfStream.pipe(outputStream);

      // Wait for the stream to finish
      await streamFinished(pdfStream);

      return outputPath;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
  
  /**
   * Generate a business overview PDF
   * @param {Object} businessData - The business data
   * @returns {Promise<string>} - The path to the generated PDF
   */
  async generateBusinessOverview(businessData) {
    return this.generatePDF('nexus_solutions', businessData);
  }
}

module.exports = new PDFGenerator(); 