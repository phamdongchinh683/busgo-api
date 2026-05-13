import ExcelJS from 'exceljs'
import type {
    CompanyRevenueMonthlyRow,
    CompanyRevenueYearlyRow,
} from '../../database/payment/payment/query.js'
import type { PaymentMethod } from '../../database/payment/payment/type.js'

type RevenueSheetMeta = { year: number; method: PaymentMethod }

const MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
] as const

function revenueTitleLine(meta: RevenueSheetMeta, granularity: 'yearly' | 'monthly') {
    const g = granularity === 'monthly' ? 'by month' : 'yearly total'
    return `Company revenue (${g}) — ${meta.year} · ${meta.method} · success`
}

export async function buildCompanyRevenueYearlySheet(
    rows: CompanyRevenueYearlyRow[],
    meta: RevenueSheetMeta
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Revenue yearly', {
        views: [{ state: 'frozen', ySplit: 2 }],
    })

    sheet.mergeCells(1, 1, 1, 2)
    sheet.getCell(1, 1).value = revenueTitleLine(meta, 'yearly')
    sheet.getCell(1, 1).font = { bold: true, size: 12 }

    const headerRow = sheet.addRow(['Company name', 'Total'])
    headerRow.font = { bold: true }
    sheet.getColumn(1).width = 42
    sheet.getColumn(2).width = 18

    for (const row of rows) {
        sheet.addRow([row.companyName, row.total])
    }

    const footer = sheet.addRow(['Total', rows.reduce((acc, x) => acc + x.total, 0)])
    footer.font = { bold: true }

    const buf = await workbook.xlsx.writeBuffer()
    return Buffer.from(buf)
}

export async function buildCompanyRevenueMonthlySheet(
    rows: CompanyRevenueMonthlyRow[],
    meta: RevenueSheetMeta
): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const colCount = 2 + MONTH_LABELS.length
    const sheet = workbook.addWorksheet('Revenue monthly', {
        views: [{ state: 'frozen', ySplit: 2 }],
    })

    sheet.mergeCells(1, 1, 1, colCount)
    sheet.getCell(1, 1).value = revenueTitleLine(meta, 'monthly')
    sheet.getCell(1, 1).font = { bold: true, size: 12 }

    const header = ['Company name', 'Total', ...MONTH_LABELS] as const
    const headerRow = sheet.addRow([...header])
    headerRow.font = { bold: true }
    sheet.getColumn(1).width = 40
    sheet.getColumn(2).width = 14
    for (let c = 3; c <= colCount; c++) {
        sheet.getColumn(c).width = 11
    }

    for (const row of rows) {
        sheet.addRow([row.companyName, row.yearTotal, ...row.months])
    }

    const monthTotals = Array(12).fill(0)
    for (const row of rows) {
        row.months.forEach((v, i) => {
            monthTotals[i] += v
        })
    }
    const grand = rows.reduce((acc, x) => acc + x.yearTotal, 0)
    const footer = sheet.addRow(['Total', grand, ...monthTotals])
    footer.font = { bold: true }

    const buf = await workbook.xlsx.writeBuffer()
    return Buffer.from(buf)
}
