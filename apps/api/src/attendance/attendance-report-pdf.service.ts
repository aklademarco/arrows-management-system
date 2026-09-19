import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export type AttendanceReportRecord = {
  firstName: string;
  lastName: string;
  status: 'EARLY' | 'ON_TIME' | 'LATE' | 'ABSENT' | 'EXCUSED';
  punctualityStatus: 'EARLY' | 'ON_TIME' | 'LATE' | null;
  checkedInAt: Date | null;
};

export type AttendancePdfInput = {
  churchName: string;
  eventName: string;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  scopeLabel: string;
  records: AttendanceReportRecord[];
};

const PRESENT_STATUSES = new Set(['EARLY', 'ON_TIME', 'LATE']);

@Injectable()
export class AttendanceReportPdfService {
  async generate(input: AttendancePdfInput): Promise<Buffer> {
    const document = new PDFDocument({
      size: 'A4',
      margins: { top: 48, right: 48, bottom: 48, left: 48 },
      info: {
        Title: `${input.eventName} attendance report`,
        Author: input.churchName,
      },
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    const complete = new Promise<Buffer>((resolve, reject) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });

    const date = new Intl.DateTimeFormat('en-GH', {
      dateStyle: 'full',
      timeZone: input.timezone,
    }).format(input.startsAt);
    const time = new Intl.DateTimeFormat('en-GH', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: input.timezone,
    });
    const present = input.records.filter((record) =>
      PRESENT_STATUSES.has(record.status),
    );
    const absent = input.records.filter((record) => record.status === 'ABSENT');
    const excused = input.records.filter(
      (record) => record.status === 'EXCUSED',
    );

    document
      .fillColor('#6b21a8')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(input.churchName.toUpperCase());
    document
      .moveDown(0.45)
      .fillColor('#111827')
      .fontSize(24)
      .text('Attendance Report');
    document
      .moveDown(0.3)
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#475569')
      .text(input.eventName)
      .text(
        `${date} · ${time.format(input.startsAt)}–${time.format(input.endsAt)}`,
      )
      .text(`Scope: ${input.scopeLabel}`);
    document.moveDown(1);

    const summaryY = document.y;
    this.summaryCard(document, 48, summaryY, 150, 'Present', present.length);
    this.summaryCard(document, 207, summaryY, 150, 'Absent', absent.length);
    this.summaryCard(
      document,
      366,
      summaryY,
      181,
      'On permission',
      excused.length,
    );
    document.y = summaryY + 66;

    this.section(document, 'Present', present, time, true);
    this.section(document, 'Absent', absent, time, false);
    this.section(document, 'On permission', excused, time, false);

    document
      .moveDown(1)
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        'Confidential church record. Share only with authorised pastoral and ministry leaders.',
      );
    document.end();
    return complete;
  }

  private summaryCard(
    document: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    label: string,
    value: number,
  ) {
    document.roundedRect(x, y, width, 52, 8).fill('#f3e8ff');
    document
      .fillColor('#6b21a8')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(String(value), x + 12, y + 9, { width: width - 24 });
    document
      .fillColor('#475569')
      .font('Helvetica')
      .fontSize(9)
      .text(label, x + 12, y + 31, { width: width - 24 });
  }

  private section(
    document: PDFKit.PDFDocument,
    title: string,
    records: AttendanceReportRecord[],
    time: Intl.DateTimeFormat,
    showArrival: boolean,
  ) {
    this.ensureSpace(document, 70);
    document
      .moveDown(1.25)
      .fillColor('#111827')
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`${title} (${records.length})`);
    document.moveDown(0.4);
    if (!records.length) {
      document
        .font('Helvetica-Oblique')
        .fontSize(10)
        .fillColor('#64748b')
        .text('No members in this category.');
      return;
    }
    records.forEach((record, index) => {
      this.ensureSpace(document, 28);
      const rowY = document.y;
      if (index % 2 === 0) document.rect(48, rowY - 4, 499, 24).fill('#f8fafc');
      const name = `${record.firstName} ${record.lastName}`;
      document
        .fillColor('#1e293b')
        .font('Helvetica')
        .fontSize(10)
        .text(name, 56, rowY, { width: 300, lineBreak: false });
      const detail = showArrival
        ? record.checkedInAt
          ? `${this.statusLabel(record.punctualityStatus ?? record.status)} · ${time.format(record.checkedInAt)}`
          : this.statusLabel(record.punctualityStatus ?? record.status)
        : title;
      document.fillColor('#64748b').text(detail, 365, rowY, {
        width: 174,
        align: 'right',
        lineBreak: false,
      });
      document.y = rowY + 24;
    });
  }

  private ensureSpace(document: PDFKit.PDFDocument, height: number) {
    if (document.y + height > document.page.height - 48) document.addPage();
  }

  private statusLabel(status: string) {
    if (status === 'ON_TIME') return 'On time';
    return status.charAt(0) + status.slice(1).toLowerCase();
  }
}
