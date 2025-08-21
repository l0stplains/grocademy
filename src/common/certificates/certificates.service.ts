import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { LocalStorageService } from '../storage/local-storage.service';

@Injectable()
export class CertificatesService {
  constructor(private storage: LocalStorageService) {}

  async generatePdf(params: {
    username: string;
    courseTitle: string;
    instructor: string;
    issuedAt: Date;
  }): Promise<{ url: string }> {
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));

    const done = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    const colors = {
      blue: '#0A75BC',
      yellow: '#FCE029',
      black: '#231F20',
      brown: '#A87A51',
      white: '#FFFFFF',
      gray: '#949699',
    };

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    // outer border
    doc
      .lineWidth(8)
      .strokeColor(colors.blue)
      .rect(margin, margin, contentWidth, pageHeight - margin * 2)
      .stroke();

    // inner decorative border
    doc
      .lineWidth(2)
      .strokeColor(colors.yellow)
      .rect(
        margin + 15,
        margin + 15,
        contentWidth - 30,
        pageHeight - margin * 2 - 30,
      )
      .stroke();

    const headerHeight = 120;
    doc
      .fillColor(colors.blue)
      .rect(margin + 25, margin + 25, contentWidth - 50, headerHeight)
      .fill();

    const watermarkSize = 380;
    const watermarkX = (pageWidth - watermarkSize) / 2;
    const watermarkY = (pageHeight - watermarkSize) / 2;

    doc.save();

    doc.fillOpacity(0.08);

    doc.image('./public/assets/img/logo.png', watermarkX, watermarkY, {
      width: watermarkSize,
      height: watermarkSize,
    });

    doc.restore();

    doc
      .fillColor(colors.white)
      .fontSize(36)
      .font('Helvetica-Bold')
      .text('CERTIFICATE', margin + 25, margin + 60, {
        width: contentWidth - 50,
        align: 'center',
      });

    doc.fontSize(18).text('OF COMPLETION', margin + 25, margin + 100, {
      width: contentWidth - 50,
      align: 'center',
    });

    // corner accents
    const accentSize = 40;

    // top left accent
    doc
      .fillColor(colors.yellow)
      .polygon([
        margin + 25,
        margin + 145,
        margin + 25 + accentSize,
        margin + 145,
        margin + 25,
        margin + 145 + accentSize,
      ])
      .fill();

    // top right accent
    doc
      .fillColor(colors.yellow)
      .polygon([
        pageWidth - margin - 25,
        margin + 145,
        pageWidth - margin - 25 - accentSize,
        margin + 145,
        pageWidth - margin - 25,
        margin + 145 + accentSize,
      ])
      .fill();

    let currentY = margin + 180;

    doc
      .fillColor(colors.black)
      .fontSize(16)
      .font('Helvetica')
      .text('This certifies that', margin + 25, currentY, {
        width: contentWidth - 50,
        align: 'center',
      });

    currentY += 40;

    const nameY = currentY;
    doc
      .fillColor(colors.blue)
      .fontSize(32)
      .font('Helvetica-Bold')
      .text(params.username, margin + 25, currentY, {
        width: contentWidth - 50,
        align: 'center',
      });

    // line under name
    doc.font('Helvetica-Bold').fontSize(32);
    const nameWidth = doc.widthOfString(params.username);
    const nameX = (pageWidth - nameWidth) / 2;
    doc
      .lineWidth(3)
      .strokeColor(colors.yellow)
      .moveTo(nameX - 30, nameY + 45)
      .lineTo(nameX + nameWidth + 30, nameY + 45)
      .stroke();

    currentY += 80;

    doc
      .fillColor(colors.black)
      .fontSize(16)
      .font('Helvetica')
      .text('has successfully completed the course', margin + 25, currentY, {
        width: contentWidth - 50,
        align: 'center',
      });

    currentY += 50;

    // course title with background
    const courseTitleHeight = 50;
    doc
      .fillColor(colors.yellow)
      .rect(margin + 80, currentY - 10, contentWidth - 160, courseTitleHeight)
      .fill();

    doc
      .fillColor(colors.black)
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(params.courseTitle, margin + 80, currentY + 5, {
        width: contentWidth - 160,
        align: 'center',
      });

    currentY += 80;

    doc
      .fillColor(colors.brown)
      .fontSize(16)
      .font('Helvetica')
      .text(`Instructor: ${params.instructor}`, margin + 25, currentY, {
        width: contentWidth - 50,
        align: 'center',
      });

    currentY += 60;

    const dateText = `Issued on: ${params.issuedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`;

    doc
      .fillColor(colors.gray)
      .fontSize(14)
      .font('Helvetica')
      .text(dateText, margin + 25, currentY, {
        width: contentWidth - 50,
        align: 'center',
      });

    // bottom decorative accents
    const bottomY = pageHeight - margin - 80;

    // bottom left accent
    doc
      .fillColor(colors.brown)
      .polygon([
        margin + 25,
        bottomY,
        margin + 25 + accentSize,
        bottomY,
        margin + 25,
        bottomY + accentSize,
      ])
      .fill();

    // bottom right accent
    doc
      .fillColor(colors.brown)
      .polygon([
        pageWidth - margin - 25,
        bottomY,
        pageWidth - margin - 25 - accentSize,
        bottomY,
        pageWidth - margin - 25,
        bottomY + accentSize,
      ])
      .fill();

    doc
      .fillColor(colors.gray)
      .fontSize(10)
      .font('Helvetica')
      .text('Grocademy', margin + 25, pageHeight - margin - 45, {
        width: contentWidth - 50,
        align: 'center',
      });

    doc.end();

    const buffer = await done;
    const { url } = await this.storage.saveBuffer(
      buffer,
      `certificate-${params.username}-${params.courseTitle}.pdf`,
      'certificates',
    );

    return { url };
  }
}
