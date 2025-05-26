const pdfParse = require('pdf-parse');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const convertPDFToText = async (pdfPath) => {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
};

const convertTextToPDF = async (text, userId) => {
    const fileName = `${userId}-${Date.now()}.pdf`;
    const outputPath = path.join(__dirname, '../uploads/coverletters', fileName);
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        doc.pipe(fs.createWriteStream(outputPath));
        
        doc.fontSize(12)
           .font('Helvetica')
           .text(text, {
               align: 'left',
               lineGap: 5
           });

        doc.end();
        
        doc.on('end', () => resolve(fileName));
        doc.on('error', reject);
    });
};

module.exports = { convertPDFToText, convertTextToPDF };
