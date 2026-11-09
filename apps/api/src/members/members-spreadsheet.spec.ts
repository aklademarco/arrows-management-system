import { Workbook } from 'exceljs';
import {
  buildMembersWorkbook,
  type MemberSpreadsheetRow,
} from './members-spreadsheet';

const member: MemberSpreadsheetRow = {
  firstName: 'Ama',
  lastName: 'Mensah',
  otherNames: null,
  email: 'ama@example.com',
  phone: '+233200000000',
  dateOfBirth: '1995-04-12',
  homeAddress: '12 Palm Street, Accra',
  closestLandmark: 'Opposite the Shell station',
  accountStatus: 'ACTIVE',
  membershipStatus: 'ON_LEAVE',
  createdAt: new Date('2026-01-15T10:00:00Z'),
  departments: [
    { name: 'Choir', isPrimary: false },
    { name: 'Ushering', isPrimary: true },
  ],
};

async function readSheet(buffer: Buffer) {
  const workbook = new Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook.getWorksheet('Members')!;
}

describe('buildMembersWorkbook', () => {
  it('writes one row per member including location fields', async () => {
    const sheet = await readSheet(await buildMembersWorkbook([member]));

    expect(sheet.rowCount).toBe(2);
    const headers = (sheet.getRow(1).values as unknown[]).slice(1);
    expect(headers).toEqual(
      expect.arrayContaining(['Home address', 'Closest landmark']),
    );

    const row = sheet.getRow(2);
    const cell = (header: string) =>
      row.getCell(headers.indexOf(header) + 1).value;
    expect(cell('Last name')).toBe('Mensah');
    expect(cell('Home address')).toBe('12 Palm Street, Accra');
    expect(cell('Closest landmark')).toBe('Opposite the Shell station');
    expect(cell('Primary department')).toBe('Ushering');
    expect(cell('Departments')).toBe('Choir, Ushering');
    expect(cell('Membership status')).toBe('On leave');
  });

  it('stores formula-like text as plain text', async () => {
    const sheet = await readSheet(
      await buildMembersWorkbook([
        { ...member, homeAddress: '=HYPERLINK("http://evil.test","x")' },
      ]),
    );

    const headers = (sheet.getRow(1).values as unknown[]).slice(1);
    const cell = sheet.getRow(2).getCell(headers.indexOf('Home address') + 1);
    expect(cell.formula).toBeUndefined();
    expect(cell.value).toBe('=HYPERLINK("http://evil.test","x")');
  });

  it('produces a header-only sheet when there are no members', async () => {
    const sheet = await readSheet(await buildMembersWorkbook([]));
    expect(sheet.rowCount).toBe(1);
  });
});
