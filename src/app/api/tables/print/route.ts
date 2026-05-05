import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import QRCode from 'qrcode'

// GET: Return print-ready HTML page with all QR codes
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    const { data: restaurant, error: restError } = await supabaseAdmin.client
      .from('restaurants')
      .select('id, name, slug')
      .eq('owner_id', userId)
      .single()

    if (restError || !restaurant) {
      return new NextResponse('Restaurant not found', { status: 404 })
    }

    const { data: tables, error: tablesError } = await supabaseAdmin.client
      .from('restaurant_tables')
      .select('table_number, qr_code_url')
      .eq('restaurant_id', restaurant.id)
      .order('table_number', { ascending: true })

    if (tablesError) {
      return new NextResponse('Failed to fetch tables', { status: 500 })
    }

    if (!tables || tables.length === 0) {
      return new NextResponse('No tables found. Generate QR codes first.', { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const menuUrl = `${baseUrl}/menu/${restaurant.slug}`

    // Generate master QR for print (walk-in / takeaway)
    const masterQrDataUrl = await QRCode.toDataURL(menuUrl, {
      width: 600,
      margin: 2,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    })

    // Build print-ready HTML
    const qrCards = tables
      .map(
        (t) => `
      <div class="qr-page">
        <div class="restaurant-name">${escapeHtml(restaurant.name)}</div>
        <img class="qr-image" src="${t.qr_code_url}" alt="Table ${t.table_number} QR Code" />
        <div class="table-label">Table ${t.table_number}</div>
        <div class="subtitle">Scan to order</div>
        <div class="url-text">${escapeHtml(menuUrl)}?table=${t.table_number}</div>
      </div>`
      )
      .join('\n')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(restaurant.name)} — Table QR Codes</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
    }

    /* Screen-only print button */
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 12px 24px;
      background: #1A1A2E;
      color: white;
    }

    .print-bar button {
      padding: 10px 28px;
      border: none;
      border-radius: 999px;
      background: #E63946;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .print-bar button:hover {
      opacity: 0.9;
    }

    .print-bar .info {
      font-size: 13px;
      opacity: 0.7;
    }

    .qr-page {
      width: 210mm;
      height: 297mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      padding: 20mm;
      background: white;
    }

    .qr-page:last-child {
      page-break-after: avoid;
    }

    .qr-page.master .table-label {
      color: #E63946;
    }

    .restaurant-name {
      font-size: 16pt;
      font-weight: 700;
      color: #1A1A2E;
      margin-bottom: 10mm;
      text-align: center;
      letter-spacing: -0.01em;
    }

    .qr-image {
      width: 110mm;
      height: 110mm;
      object-fit: contain;
      border-radius: 4px;
    }

    .table-label {
      font-size: 28pt;
      font-weight: 800;
      color: #1A1A2E;
      margin-top: 10mm;
      text-align: center;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 11pt;
      color: #888;
      margin-top: 4mm;
      text-align: center;
    }

    .url-text {
      font-size: 8pt;
      color: #bbb;
      margin-top: 2mm;
      text-align: center;
      word-break: break-all;
    }

    @media print {
      .print-bar {
        display: none !important;
      }

      body {
        background: white;
      }

      .qr-page {
        page-break-after: always;
      }

      .qr-page:last-child {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span class="info">${tables.length + 1} QR codes — ${escapeHtml(restaurant.name)}</span>
    <button onclick="window.print()">🖨️ Print All QR Codes</button>
  </div>

  <!-- Master QR: Walk-in / Takeaway -->
  <div class="qr-page master">
    <div class="restaurant-name">${escapeHtml(restaurant.name)}</div>
    <img class="qr-image" src="${masterQrDataUrl}" alt="Walk-in QR Code" />
    <div class="table-label">Walk-in / Takeaway</div>
    <div class="subtitle">Scan to browse the menu</div>
    <div class="url-text">${escapeHtml(menuUrl)}</div>
  </div>

  ${qrCards}
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch {
    return new NextResponse('Something went wrong', { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
