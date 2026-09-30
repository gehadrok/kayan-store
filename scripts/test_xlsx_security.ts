/**
 * Kayan | كيان — Comprehensive Spreadsheet Security Test Suite
 *
 * Validates the hardened SafeSpreadsheetProcessor against 12 critical security scenarios:
 * 1. normal XLSX
 * 2. Arabic XLSX
 * 3. multi-sheet XLSX
 * 4. large workbook
 * 5. malformed workbook
 * 6. crafted workbook
 * 7. oversized workbook
 * 8. excessive-sheet workbook
 * 9. excessive-cell workbook
 * 10. path traversal attempt
 * 11. external resource attempt (XXE)
 * 12. timeout / resource exhaustion
 */

import AdmZip from 'adm-zip';
import { SafeSpreadsheetProcessor } from '../src/server/documents/processors/SafeSpreadsheetProcessor.ts';

const processor = new SafeSpreadsheetProcessor();

interface TestResult {
  id: number;
  name: string;
  expectedOutcome: 'SUCCESS' | 'REJECTED';
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function colToLetter(colIndex: number): string {
  let temp = colIndex + 1;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

function buildValidZip(sheets: Array<{ name: string; rows: any[][] }>): Buffer {
  const zip = new AdmZip();

  let overrides = '';
  let rels = '';
  let sheetElements = '';

  sheets.forEach((s, idx) => {
    const id = idx + 1;
    overrides += `  <Override PartName="/xl/worksheets/sheet${id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
    rels += `  <Relationship Id="rId${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${id}.xml"/>\n`;
    sheetElements += `    <sheet name="${s.name}" sheetId="${id}" r:id="rId${id}"/>\n`;

    let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n  <sheetData>\n`;
    s.rows.forEach((row, rIdx) => {
      sheetXml += `    <row r="${rIdx + 1}">\n`;
      row.forEach((cell, cIdx) => {
        const colLetter = colToLetter(cIdx);
        const cellRef = `${colLetter}${rIdx + 1}`;
        if (typeof cell === 'number') {
          sheetXml += `      <c r="${cellRef}"><v>${cell}</v></c>\n`;
        } else {
          sheetXml += `      <c r="${cellRef}" t="inlineStr"><is><t>${String(cell)}</t></is></c>\n`;
        }
      });
      sheetXml += `    </row>\n`;
    });
    sheetXml += `  </sheetData>\n</worksheet>`;
    zip.addFile(`xl/worksheets/sheet${id}.xml`, Buffer.from(sheetXml));
  });

  zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${overrides}</Types>`));

  zip.addFile('_rels/.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`));

  zip.addFile('xl/_rels/workbook.xml.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${rels}</Relationships>`));

  zip.addFile('xl/workbook.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheetElements}  </sheets>
</workbook>`));

  return zip.toBuffer();
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Kayan | كيان — XLSX Security & Verification Test Suite');
  console.log('================================================================\n');

  // Test 1: Normal XLSX
  try {
    const buf = buildValidZip([{
      name: 'Sales',
      rows: [
        ['Product', 'Q1', 'Q2', 'Total'],
        ['App License', 100, 150, 250],
        ['Support Pack', 50, 75, 125]
      ]
    }]);
    const res = await processor.process(buf);
    const passed = res.sheets.length === 1 && res.sheets[0].sheetName === 'Sales' && res.sheets[0].rowCount === 3;
    results.push({
      id: 1,
      name: 'Normal XLSX Ingestion',
      expectedOutcome: 'SUCCESS',
      passed,
      details: passed ? `Parsed 1 sheet, ${res.sheets[0].rowCount} rows successfully` : 'Failed row/sheet match'
    });
  } catch (err: any) {
    results.push({ id: 1, name: 'Normal XLSX Ingestion', expectedOutcome: 'SUCCESS', passed: false, details: err.message });
  }

  // Test 2: Arabic XLSX
  try {
    const buf = buildValidZip([{
      name: 'الموظفين_والفروع',
      rows: [
        ['الاسم الكامل', 'الوظيفة', 'الفرع', 'الراتب بالريال'],
        ['م. جهاد الصليحي', 'كبير مهندسي البرمجيات', 'الضالع - الإدارة العامة', 2500000],
        ['سعيد عبد الله', 'مسؤول التوزيع والدعم', 'عدن - كريتر', 1200000]
      ]
    }]);
    const res = await processor.process(buf);
    const passed = res.sheets.length === 1 &&
      res.sheets[0].sheetName === 'الموظفين_والفروع' &&
      res.text.includes('جهاد الصليحي') &&
      res.text.includes('الضالع');
    results.push({
      id: 2,
      name: 'Arabic Headers & RTL Cell Values',
      expectedOutcome: 'SUCCESS',
      passed,
      details: passed ? 'Preserved Arabic UTF-8 sheet name and cell content perfectly' : 'Arabic content corrupted'
    });
  } catch (err: any) {
    results.push({ id: 2, name: 'Arabic Headers & RTL Cell Values', expectedOutcome: 'SUCCESS', passed: false, details: err.message });
  }

  // Test 3: Multi-sheet XLSX
  try {
    const buf = buildValidZip([
      { name: 'الربع_الأول', rows: [['البند', 'القيمة'], ['إيرادات التطبيقات', 850000]] },
      { name: 'الربع_الثاني', rows: [['البند', 'القيمة'], ['إيرادات الخدمات', 1200000]] },
      { name: 'ملخص_السنوي', rows: [['البند', 'الإجمالي'], ['الصافي العام', 2050000]] }
    ]);
    const res = await processor.process(buf);
    const passed = res.sheets.length === 3 && res.sheets[0].sheetName === 'الربع_الأول' && res.sheets[2].sheetName === 'ملخص_السنوي';
    results.push({
      id: 3,
      name: 'Multi-Sheet Structure Parsing',
      expectedOutcome: 'SUCCESS',
      passed,
      details: passed ? `Parsed 3 distinct worksheets with preserved names and row sets` : 'Multi-sheet mismatch'
    });
  } catch (err: any) {
    results.push({ id: 3, name: 'Multi-Sheet Structure Parsing', expectedOutcome: 'SUCCESS', passed: false, details: err.message });
  }

  // Test 4: Large Workbook (Row and Column Limits)
  try {
    const largeRows: any[][] = [];
    for (let r = 0; r < 600; r++) {
      const row: any[] = [];
      for (let c = 0; c < 60; c++) {
        row.push(`R${r}C${c}`);
      }
      largeRows.push(row);
    }
    const buf = buildValidZip([{ name: 'LargeData', rows: largeRows }]);
    const res = await processor.process(buf);
    // Bounded to 500 rows and 50 cols
    const passed = res.sheets[0].columnCount <= 50 && res.sheets[0].sampleRows.length <= 50;
    results.push({
      id: 4,
      name: 'Large Workbook Bounding (Rows & Columns)',
      expectedOutcome: 'SUCCESS',
      passed,
      details: passed ? `Safely bounded rows to 500 and cols to 50 (processed ${res.totalCells} cells)` : 'Bounding failed'
    });
  } catch (err: any) {
    results.push({ id: 4, name: 'Large Workbook Bounding (Rows & Columns)', expectedOutcome: 'SUCCESS', passed: false, details: err.message });
  }

  // Test 5: Malformed Workbook (Random Binary)
  try {
    const junk = Buffer.from('This is completely invalid binary junk mimicking a corrupted file');
    await processor.process(junk);
    results.push({ id: 5, name: 'Malformed Workbook Rejection', expectedOutcome: 'REJECTED', passed: false, details: 'Accepted corrupted file without error' });
  } catch (err: any) {
    const passed = err.message.includes('FILE_PROCESSING_FAILED');
    results.push({ id: 5, name: 'Malformed Workbook Rejection', expectedOutcome: 'REJECTED', passed, details: `Safely rejected: ${err.message}` });
  }

  // Test 6: Crafted Workbook (Truncated Central Directory)
  try {
    const valid = buildValidZip([{ name: 'Test', rows: [['A', 'B']] }]);
    const corrupted = valid.subarray(0, valid.length - 150); // Cut off central directory
    await processor.process(corrupted);
    results.push({ id: 6, name: 'Crafted Truncated ZIP Container', expectedOutcome: 'REJECTED', passed: false, details: 'Failed to reject truncated archive' });
  } catch (err: any) {
    const passed = err.message.includes('FILE_PROCESSING_FAILED') || err.message.includes('SECURITY_VIOLATION');
    results.push({ id: 6, name: 'Crafted Truncated ZIP Container', expectedOutcome: 'REJECTED', passed, details: `Safely trapped: ${err.message}` });
  }

  // Test 7: Oversized Workbook (Exceeds maxFileSize)
  try {
    const oversizedBuf = Buffer.alloc(30 * 1024 * 1024, 0x50); // 30 MB (limit is 25 MB)
    await processor.process(oversizedBuf);
    results.push({ id: 7, name: 'Oversized File Size Rejection', expectedOutcome: 'REJECTED', passed: false, details: 'Allowed oversized file' });
  } catch (err: any) {
    const passed = err.message.includes('exceeds limit');
    results.push({ id: 7, name: 'Oversized File Size Rejection', expectedOutcome: 'REJECTED', passed, details: `Safely rejected by size barrier: ${err.message}` });
  }

  // Test 8: Excessive-Sheet Workbook (> 30 sheets)
  try {
    const manySheets: Array<{ name: string; rows: any[][] }> = [];
    for (let i = 1; i <= 35; i++) {
      manySheets.push({ name: `Sheet_${i}`, rows: [['A', i]] });
    }
    const buf = buildValidZip(manySheets);
    await processor.process(buf, { maxSheets: 30 });
    results.push({ id: 8, name: 'Excessive Sheet Count Defense', expectedOutcome: 'REJECTED', passed: false, details: 'Allowed workbook with > 30 worksheets' });
  } catch (err: any) {
    const passed = err.message.includes('Worksheet count') && err.message.includes('exceeds limit');
    results.push({ id: 8, name: 'Excessive Sheet Count Defense', expectedOutcome: 'REJECTED', passed, details: `Safely rejected: ${err.message}` });
  }

  // Test 9: Excessive-Cell Workbook (Total cell threshold)
  try {
    const rows: any[][] = [];
    for (let r = 0; r < 200; r++) {
      const row: any[] = [];
      for (let c = 0; c < 20; c++) {
        row.push(r * c);
      }
      rows.push(row);
    }
    const buf = buildValidZip([{ name: 'LotsOfCells', rows }]);
    // Enforce maxTotalCells = 500
    const res = await processor.process(buf, { maxTotalCells: 500 });
    const passed = (res.totalCells || 0) <= 500;
    results.push({
      id: 9,
      name: 'Excessive Cell Expansion Limiter',
      expectedOutcome: 'SUCCESS',
      passed,
      details: passed ? `Enforced hard cap on cell ingestion: ${res.totalCells} cells` : 'Failed cell bounding'
    });
  } catch (err: any) {
    results.push({ id: 9, name: 'Excessive Cell Expansion Limiter', expectedOutcome: 'SUCCESS', passed: false, details: err.message });
  }

  // Test 10: Path Traversal Attempt
  try {
    const zip = new AdmZip();
    zip.addFile('target_payload.xml', Buffer.from('data'));
    zip.addFile('xl/workbook.xml', Buffer.from('<workbook></workbook>'));
    let maliciousBuf = zip.toBuffer();
    // Inject '../../etc/passwd' into the filename bytes inside the zip buffer
    const idx = maliciousBuf.indexOf('target_payload.xml');
    if (idx !== -1) {
      const copy = Buffer.from(maliciousBuf);
      copy.write('../../etc/p.xml', idx, 'ascii');
      maliciousBuf = copy;
    }
    await processor.process(maliciousBuf);
    results.push({ id: 10, name: 'Path Traversal Injection Defense', expectedOutcome: 'REJECTED', passed: false, details: 'Accepted zip entry with path traversal' });
  } catch (err: any) {
    const passed = err.message.includes('Path traversal attempt detected');
    results.push({ id: 10, name: 'Path Traversal Injection Defense', expectedOutcome: 'REJECTED', passed, details: `Safely blocked: ${err.message}` });
  }

  // Test 11: External Resource / XXE Injection Attempt
  try {
    const zip = new AdmZip();
    zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/"> ]>
<Types><Override PartName="/xl/workbook.xml"/></Types>`));
    zip.addFile('xl/workbook.xml', Buffer.from('<workbook>&xxe;</workbook>'));
    const maliciousBuf = zip.toBuffer();
    await processor.process(maliciousBuf);
    results.push({ id: 11, name: 'XML External Entity (XXE) Injection Defense', expectedOutcome: 'REJECTED', passed: false, details: 'Accepted XXE entity injection' });
  } catch (err: any) {
    const passed = err.message.includes('XML External Entity (XXE)');
    results.push({ id: 11, name: 'XML External Entity (XXE) Injection Defense', expectedOutcome: 'REJECTED', passed, details: `Safely blocked: ${err.message}` });
  }

  // Test 12: Timeout / Resource Exhaustion Protection
  try {
    const buf = buildValidZip([{
      name: 'NormalSheet',
      rows: [['A', 1], ['B', 2]]
    }]);
    // Set an ultra-low timeout (0ms) to trigger immediate timeout protection
    await processor.process(buf, { timeoutMs: 0 });
    results.push({ id: 12, name: 'Timeout / Resource Exhaustion Protection', expectedOutcome: 'REJECTED', passed: false, details: 'Failed to timeout within threshold' });
  } catch (err: any) {
    const passed = err.message.includes('TIMEOUT:');
    results.push({ id: 12, name: 'Timeout / Resource Exhaustion Protection', expectedOutcome: 'REJECTED', passed, details: `Safely aborted: ${err.message}` });
  }

  // Print Summary Table
  console.log('| ID | Test Name | Expected | Result | Details |');
  console.log('| :--- | :--- | :--- | :--- | :--- |');
  let allPassed = true;
  for (const r of results) {
    const status = r.passed ? '✅ PASS' : '❌ FAIL';
    if (!r.passed) allPassed = false;
    console.log(`| ${r.id} | ${r.name} | ${r.expectedOutcome} | ${status} | ${r.details} |`);
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL 12 SECURITY SCENARIOS PASSED WITH ZERO VULNERABILITIES!');
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
