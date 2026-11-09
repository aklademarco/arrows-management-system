import { Workbook } from 'exceljs';

export type MemberSpreadsheetRow = {
  firstName: string;
  lastName: string;
  otherNames: string | null;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  homeAddress: string | null;
  closestLandmark: string | null;
  accountStatus: string;
  membershipStatus: string;
  createdAt: Date;
  departments: { name: string; isPrimary: boolean }[];
};

const COLUMNS = [
  { header: 'Last name', key: 'lastName', width: 18 },
  { header: 'First name', key: 'firstName', width: 18 },
  { header: 'Other names', key: 'otherNames', width: 18 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Phone', key: 'phone', width: 18 },
  { header: 'Date of birth', key: 'dateOfBirth', width: 14 },
  { header: 'Home address', key: 'homeAddress', width: 36 },
  { header: 'Closest landmark', key: 'closestLandmark', width: 28 },
  { header: 'Primary department', key: 'primaryDepartment', width: 22 },
  { header: 'Departments', key: 'departments', width: 32 },
  { header: 'Membership status', key: 'membershipStatus', width: 18 },
  { header: 'Account status', key: 'accountStatus', width: 16 },
  { header: 'Joined', key: 'joined', width: 14 },
];

/** "ON_LEAVE" -> "On leave" */
function humanizeStatus(value: string) {
  const words = value.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Builds the member records workbook.
 *
 * Every value is written as a plain cell value, never as a formula, so text
 * such as "=HYPERLINK(...)" entered by a member cannot run in Excel.
 */
export async function buildMembersWorkbook(
  rows: MemberSpreadsheetRow[],
): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Members', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = COLUMNS;

  for (const member of rows) {
    sheet.addRow({
      lastName: member.lastName,
      firstName: member.firstName,
      otherNames: member.otherNames ?? '',
      email: member.email,
      phone: member.phone ?? '',
      dateOfBirth: member.dateOfBirth ?? '',
      homeAddress: member.homeAddress ?? '',
      closestLandmark: member.closestLandmark ?? '',
      primaryDepartment:
        member.departments.find((department) => department.isPrimary)?.name ??
        '',
      departments: member.departments
        .map((department) => department.name)
        .join(', '),
      membershipStatus: humanizeStatus(member.membershipStatus),
      accountStatus: humanizeStatus(member.accountStatus),
      joined: member.createdAt,
    });
  }

  sheet.getColumn('joined').numFmt = 'yyyy-mm-dd';
  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEDE9FE' },
  };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: COLUMNS.length },
  };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
