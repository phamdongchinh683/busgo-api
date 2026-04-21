import ExcelJS from 'exceljs'

/** ExcelJS `row.values = [...]` uses a special offset when index 0 exists; set cells explicitly. */
function setRowCells(row: ExcelJS.Row, values: readonly (string | number | undefined)[]) {
    values.forEach((v, i) => {
        if (v !== undefined) {
            row.getCell(i + 1).value = v
        }
    })
}
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

    setRowCells(sheet.getRow(2), ['Company name', 'Total'])
    sheet.getRow(2).font = { bold: true }
    sheet.getColumn(1).width = 42
    sheet.getColumn(2).width = 18

    let r = 3
    for (const row of rows) {
        setRowCells(sheet.getRow(r), [row.companyName, row.total])
        r++
    }

    setRowCells(sheet.getRow(r), ['Total', rows.reduce((acc, x) => acc + x.total, 0)])
    sheet.getRow(r).font = { bold: true }

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
    setRowCells(sheet.getRow(2), header)
    sheet.getRow(2).font = { bold: true }
    sheet.getColumn(1).width = 40
    sheet.getColumn(2).width = 14
    for (let c = 3; c <= colCount; c++) {
        sheet.getColumn(c).width = 11
    }

    let r = 3
    for (const row of rows) {
        setRowCells(sheet.getRow(r), [row.companyName, row.yearTotal, ...row.months])
        r++
    }

    const monthTotals = Array(12).fill(0)
    for (const row of rows) {
        row.months.forEach((v, i) => {
            monthTotals[i] += v
        })
    }
    const grand = rows.reduce((acc, x) => acc + x.yearTotal, 0)
    setRowCells(sheet.getRow(r), ['Total', grand, ...monthTotals])
    sheet.getRow(r).font = { bold: true }

    const buf = await workbook.xlsx.writeBuffer()
    return Buffer.from(buf)
}
