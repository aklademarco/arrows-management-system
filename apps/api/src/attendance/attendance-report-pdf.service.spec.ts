import { AttendanceReportPdfService } from './attendance-report-pdf.service';

describe('AttendanceReportPdfService', () => {
  it('generates a readable PDF attachment', async () => {
    const pdf = await new AttendanceReportPdfService().generate({
      churchName: 'Arrows',
      eventName: 'Sunday Service',
      startsAt: new Date('2026-09-20T08:40:00.000Z'),
      endsAt: new Date('2026-09-20T12:00:00.000Z'),
      timezone: 'Africa/Accra',
      scopeLabel: 'Whole church',
      records: [
        {
          firstName: 'Ama',
          lastName: 'Mensah',
          status: 'ON_TIME',
          punctualityStatus: 'ON_TIME',
          checkedInAt: new Date('2026-09-20T08:35:00.000Z'),
        },
      ],
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(1_000);
  });
});
