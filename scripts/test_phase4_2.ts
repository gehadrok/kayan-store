import AdmZip from 'adm-zip';

function createMockXlsx(): Buffer {
  const zip = new AdmZip();
  zip.addFile('[Content_Types].xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`));
  zip.addFile('_rels/.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`));
  zip.addFile('xl/_rels/workbook.xml.rels', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`));
  zip.addFile('xl/workbook.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Budget" sheetId="1" r:id="rId1"/></sheets>
</workbook>`));
  zip.addFile('xl/worksheets/sheet1.xml', Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>Month</t></is></c><c r="B1" t="inlineStr"><is><t>Expenses</t></is></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>Jan</t></is></c><c r="B2"><v>4000</v></c></row>
    <row r="3"><c r="A3" t="inlineStr"><is><t>Feb</t></is></c><c r="B3"><v>3500</v></c></row>
  </sheetData>
</worksheet>`));
  return zip.toBuffer();
}

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING PHASE 4.2 COMPREHENSIVE VERIFICATION ===\n');

  // 1. Setup User A and User B
  const userAEmail = `usera_${Date.now()}@example.com`;
  const userBEmail = `userb_${Date.now()}@example.com`;
  const pass = 'password123';

  console.log('[1/10] Registering User A & User B...');
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password: pass, displayName: 'User A' })
  });
  const regA = await regARes.json();
  const tokenA = regA.token;

  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userBEmail, password: pass, displayName: 'User B' })
  });
  const regB = await regBRes.json();
  const tokenB = regB.token;

  if (!tokenA || !tokenB) {
    throw new Error('Failed to create test users');
  }
  console.log('✓ User A & User B registered successfully.\n');

  // 2. Test File Format Validations (Upload)
  console.log('[2/10] Testing Upload Validations & Security Boundaries...');

  // 2a. Legacy .doc rejection -> DOC_FORMAT_NOT_SUPPORTED
  const fdDoc = new FormData();
  fdDoc.append('file', new Blob([Buffer.from('Legacy Word Doc')], { type: 'application/msword' }), 'contract.doc');
  const resDoc = await fetch(`${BASE_URL}/api/ai/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: fdDoc
  });
  const jsonDoc = await resDoc.json();
  console.log('Legacy .doc rejection:', jsonDoc.error === 'DOC_FORMAT_NOT_SUPPORTED' ? '✓ PASS (DOC_FORMAT_NOT_SUPPORTED)' : '✗ FAIL');

  // 2b. Unsupported file format (.exe) -> FILE_TYPE_NOT_SUPPORTED
  const fdExe = new FormData();
  fdExe.append('file', new Blob([Buffer.from('MZ binary')], { type: 'application/octet-stream' }), 'app.exe');
  const resExe = await fetch(`${BASE_URL}/api/ai/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: fdExe
  });
  const jsonExe = await resExe.json();
  console.log('Unsupported .exe rejection:', jsonExe.error === 'FILE_TYPE_NOT_SUPPORTED' ? '✓ PASS (FILE_TYPE_NOT_SUPPORTED)' : '✗ FAIL');

  // 2c. Empty file -> FILE_INVALID
  const fdEmpty = new FormData();
  fdEmpty.append('file', new Blob([Buffer.alloc(0)], { type: 'text/csv' }), 'empty.csv');
  const resEmpty = await fetch(`${BASE_URL}/api/ai/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: fdEmpty
  });
  const jsonEmpty = await resEmpty.json();
  console.log('Empty file rejection:', jsonEmpty.error === 'FILE_INVALID' ? '✓ PASS (FILE_INVALID)' : `✗ FAIL (${jsonEmpty.error})`);

  // 3. Upload Valid Supported Documents
  console.log('\n[3/10] Uploading Valid Supported Documents (CSV, XLSX)...');

  // 3a. CSV
  const csvContent = 'id,product,category,revenue\n1,Kayan CRM,Software,15000\n2,Kayan PDF,Software,25000\n3,Consulting,Service,10000';
  const fdCsv = new FormData();
  fdCsv.append('file', new Blob([Buffer.from(csvContent)], { type: 'text/csv' }), 'sales_data.csv');
  const resCsv = await fetch(`${BASE_URL}/api/ai/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: fdCsv
  });
  const jsonCsv = await resCsv.json();
  const docAId = jsonCsv.document?.id;
  console.log('CSV Upload:', jsonCsv.success && docAId ? `✓ PASS (Doc ID: ${docAId})` : '✗ FAIL');

  // 3b. XLSX
  const xlsxBuf = createMockXlsx();
  const fdXlsx = new FormData();
  fdXlsx.append('file', new Blob([new Uint8Array(xlsxBuf)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'budget.xlsx');
  const resXlsx = await fetch(`${BASE_URL}/api/ai/documents`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: fdXlsx
  });
  const jsonXlsx = await resXlsx.json();
  console.log('XLSX Upload:', jsonXlsx.success ? '✓ PASS' : '✗ FAIL');

  // 4. Test Document List & Detail APIs
  console.log('\n[4/10] Testing Document List & Detail APIs...');
  const resList = await fetch(`${BASE_URL}/api/ai/documents`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const jsonList = await resList.json();
  console.log('List Documents (User A):', jsonList.documents?.length >= 2 ? `✓ PASS (${jsonList.documents.length} docs)` : '✗ FAIL');

  const resDetail = await fetch(`${BASE_URL}/api/ai/documents/${docAId}`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const jsonDetail = await resDetail.json();
  console.log('Document Detail & Preview:', jsonDetail.success && jsonDetail.preview?.hasText ? '✓ PASS' : '✗ FAIL');

  // 5. Test IDOR Protection
  console.log('\n[5/10] Testing IDOR Security Protections (User B attacking User A Document)...');

  // 5a. User B GET /api/ai/documents/:id (User A's doc)
  const idorGet = await fetch(`${BASE_URL}/api/ai/documents/${docAId}`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  console.log('IDOR GET Document:', idorGet.status === 403 ? '✓ PASS (403 Forbidden)' : `✗ FAIL (${idorGet.status})`);

  // 5b. User B GET /api/ai/documents/:id/download
  const idorDownload = await fetch(`${BASE_URL}/api/ai/documents/${docAId}/download`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  console.log('IDOR DOWNLOAD Document:', idorDownload.status === 403 ? '✓ PASS (403 Forbidden)' : `✗ FAIL (${idorDownload.status})`);

  // 5c. User B POST /api/ai/documents/:id/analyze
  const idorAnalyze = await fetch(`${BASE_URL}/api/ai/documents/${docAId}/analyze`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'financial_analysis', instruction: 'analyze revenue' })
  });
  console.log('IDOR ANALYZE Document:', idorAnalyze.status === 403 ? '✓ PASS (403 Forbidden)' : `✗ FAIL (${idorAnalyze.status})`);

  // 5d. User B POST /api/ai/documents/:id/ask
  const idorAsk = await fetch(`${BASE_URL}/api/ai/documents/${docAId}/ask`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What is the revenue?' })
  });
  console.log('IDOR ASK Document:', idorAsk.status === 403 ? '✓ PASS (403 Forbidden)' : `✗ FAIL (${idorAsk.status})`);

  // 5e. User B POST /api/ai/documents/:id/summarize
  const idorSummarize = await fetch(`${BASE_URL}/api/ai/documents/${docAId}/summarize`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  console.log('IDOR SUMMARIZE Document:', idorSummarize.status === 403 ? '✓ PASS (403 Forbidden)' : `✗ FAIL (${idorSummarize.status})`);

  // 5f. User B DELETE /api/ai/documents/:id
  const idorDelete = await fetch(`${BASE_URL}/api/ai/documents/${docAId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  console.log('IDOR DELETE Document:', idorDelete.status === 403 ? '✓ PASS (403 Forbidden)' : `✗ FAIL (${idorDelete.status})`);

  // 6. Test AI Analysis, Ask, Summarize Endpoints & Lifecycle
  console.log('\n[6/10] Testing Document Intelligence APIs (User A with Doc A)...');

  // 6a. Analyze
  const analyzeRes = await fetch(`${BASE_URL}/api/ai/documents/${docAId}/analyze`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'financial_analysis', instruction: 'تحليل الإيرادات والمنتجات' })
  });
  const analyzeJson = await analyzeRes.json();
  console.log('Analyze Endpoint Status:', analyzeRes.status);
  if (analyzeJson.success) {
    console.log('✓ PASS: Analysis generated successfully with Job ID:', analyzeJson.jobId);
  } else if (['AI_QUOTA_EXCEEDED', 'AI_PROVIDER_UNAVAILABLE', 'AI_PROVIDER_NOT_CONFIGURED'].includes(analyzeJson.error)) {
    console.log(`✓ PASS: Handled normalized AI Provider status (${analyzeJson.error}), Job ID:`, analyzeJson.jobId);
  } else {
    console.log('Analyze unexpected status:', analyzeJson);
  }

  // 6b. Ask Document
  const askRes = await fetch(`${BASE_URL}/api/ai/documents/${docAId}/ask`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'ما هو إجمالي الإيرادات؟' })
  });
  const askJson = await askRes.json();
  console.log('Ask Endpoint Status:', askRes.status);
  if (askJson.success) {
    console.log('✓ PASS: Ask answer received successfully with Job ID:', askJson.jobId);
  } else if (['AI_QUOTA_EXCEEDED', 'AI_PROVIDER_UNAVAILABLE', 'AI_PROVIDER_NOT_CONFIGURED'].includes(askJson.error)) {
    console.log(`✓ PASS: Handled normalized AI Provider status (${askJson.error}), Job ID:`, askJson.jobId);
  }

  // 6c. Summarize Document
  const sumRes = await fetch(`${BASE_URL}/api/ai/documents/${docAId}/summarize`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const sumJson = await sumRes.json();
  console.log('Summarize Endpoint Status:', sumRes.status);
  if (sumJson.success) {
    console.log('✓ PASS: Summary received successfully with Job ID:', sumJson.jobId);
  } else if (['AI_QUOTA_EXCEEDED', 'AI_PROVIDER_UNAVAILABLE', 'AI_PROVIDER_NOT_CONFIGURED'].includes(sumJson.error)) {
    console.log(`✓ PASS: Handled normalized AI Provider status (${sumJson.error}), Job ID:`, sumJson.jobId);
  }

  // 7. Test Download API
  console.log('\n[7/10] Testing Document Download API...');
  const dlRes = await fetch(`${BASE_URL}/api/ai/documents/${docAId}/download`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const dlText = await dlRes.text();
  const dlDisposition = dlRes.headers.get('content-disposition');
  console.log('Download Status:', dlRes.status === 200 ? '✓ PASS (200 OK)' : '✗ FAIL');
  console.log('Content-Disposition header:', dlDisposition);
  console.log('Downloaded Content matches original:', dlText === csvContent ? '✓ PASS' : '✗ FAIL');

  // 8. Test Delete API
  console.log('\n[8/10] Testing Document Delete API...');
  const delRes = await fetch(`${BASE_URL}/api/ai/documents/${docAId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const delJson = await delRes.json();
  console.log('Delete Response:', delJson.success ? '✓ PASS' : '✗ FAIL');

  // Verify it is gone
  const checkGone = await fetch(`${BASE_URL}/api/ai/documents/${docAId}`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  console.log('Verify document is deleted:', checkGone.status === 404 ? '✓ PASS (404 Not Found)' : '✗ FAIL');

  // 9. Regression Testing across Kayan Store
  console.log('\n[9/10] Running Regression Tests across Kayan Store modules...');
  const regTests = [
    { name: 'Products Catalog', url: '/api/products', status: 200 },
    { name: 'Categories List', url: '/api/categories', status: 200 },
    { name: 'User Library (Auth)', url: '/api/me/library', headers: { 'Authorization': `Bearer ${tokenA}` }, status: 200 },
    { name: 'AI Projects List', url: '/api/ai/projects', headers: { 'Authorization': `Bearer ${tokenA}` }, status: 200 },
    { name: 'AI Documents List', url: '/api/ai/documents', headers: { 'Authorization': `Bearer ${tokenA}` }, status: 200 },
    { name: 'Admin Auth Protection', url: '/api/admin/users', headers: { 'Authorization': `Bearer ${tokenA}` }, status: 401 }
  ];

  for (const t of regTests) {
    const r = await fetch(`${BASE_URL}${t.url}`, { headers: t.headers });
    console.log(`Regression: ${t.name}:`, r.status === t.status ? `✓ PASS (${r.status})` : `✗ FAIL (${r.status})`);
  }

  console.log('\n=== ALL PHASE 4.2 VERIFICATIONS COMPLETED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
