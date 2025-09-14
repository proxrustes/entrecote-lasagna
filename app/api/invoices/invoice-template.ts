export interface InvoiceData {
  invoiceNumber: string
  user: {
    id: string
    name: string
    address: string
    contractId: string | null
  }
  provider?: {
    name: string
    address: string
  }
  building?: {
    buildingId: string
    address: string
  }
  period: {
    startDate: string
    endDate: string
  }
  consumption: {
    gridKwh: number
    pvKwh: number
    totalKwh: number
    dataPoints: number
  }
  costs: {
    gridCost: number
    pvCost: number
    baseFee: number
    totalAmount: number
    currency: string
    rates: {
      gridRate: number
      pvRate: number
    }
  }
  generatedAt: string
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const startDate = new Date(data.period.startDate).toLocaleDateString('de-DE')
  const endDate = new Date(data.period.endDate).toLocaleDateString('de-DE')
  const generatedDate = new Date(data.generatedAt).toLocaleDateString('de-DE')
  const contractDate = '01.01.2024' // Mock contract date

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rechnung ${data.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #000;
          max-width: 210mm;
          margin: 0 auto;
          padding: 20mm;
          background: white;
          font-size: 11pt;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .provider-address {
          width: 45%;
          font-size: 10pt;
          line-height: 1.3;
        }
        .provider-address strong {
          font-size: 12pt;
          display: block;
          margin-bottom: 5px;
        }
        .tenant-address {
          margin: 30px 0;
          font-size: 11pt;
          line-height: 1.4;
        }
        .date-location {
          text-align: right;
          margin: 20px 0;
          font-size: 10pt;
        }
        .contract-header {
          font-weight: bold;
          margin: 30px 0 20px 0;
          font-size: 11pt;
        }
        .greeting {
          margin: 20px 0;
          line-height: 1.5;
        }
        .content-section {
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="provider-address">
          <strong>${data.provider?.name || 'RoofShare Energy GmbH'}</strong>
          ${data.provider?.address || 'Musterstraße 123<br>10115 Berlin<br>Deutschland'}
          <br><br>
          Tel: +49 30 123456789<br>
          E-Mail: info@roofshare.de
        </div>
      </div>

      <div class="tenant-address">
        ${data.user.name}<br>
        ${data.user.address.replace(',', '<br>')}
      </div>

      <div class="date-location">
        Berlin, den ${generatedDate}
      </div>

      <div class="contract-header">
        Lieferung von Strom gemäß Stromliefervertrag vom ${contractDate}
      </div>

      <div class="greeting">
        Sehr geehrter Herr ${data.user.name.split(' ').pop()},
      </div>

      <div class="content-section">
        für die Stromlieferung an Ihre Verbrauchsstelle (${data.building?.address || data.user.address})
        im Zeitraum vom ${startDate} bis ${endDate} stellen wir Ihnen folgende Kosten in Rechnung:
      </div>

      <!-- Keep existing table and totals for now -->
      <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #000; padding: 8px; text-align: left;">Beschreibung</th>
            <th style="border-bottom: 1px solid #000; padding: 8px; text-align: right;">Menge</th>
            <th style="border-bottom: 1px solid #000; padding: 8px; text-align: left;">Einheit</th>
            <th style="border-bottom: 1px solid #000; padding: 8px; text-align: right;">Preis/Einheit</th>
            <th style="border-bottom: 1px solid #000; padding: 8px; text-align: right;">Gesamtpreis</th>
          </tr>
        </thead>
        <tbody>
          ${data.consumption.gridKwh > 0 ? `
          <tr>
            <td style="padding: 8px;">Stromverbrauch (Netz)</td>
            <td style="padding: 8px; text-align: right;">${data.consumption.gridKwh.toFixed(3)}</td>
            <td style="padding: 8px;">kWh</td>
            <td style="padding: 8px; text-align: right;">${data.costs.rates.gridRate.toFixed(3)} ${data.costs.currency}</td>
            <td style="padding: 8px; text-align: right;">${data.costs.gridCost.toFixed(2)} ${data.costs.currency}</td>
          </tr>` : ''}
          ${data.consumption.pvKwh > 0 ? `
          <tr>
            <td style="padding: 8px;">Stromverbrauch (PV)</td>
            <td style="padding: 8px; text-align: right;">${data.consumption.pvKwh.toFixed(3)}</td>
            <td style="padding: 8px;">kWh</td>
            <td style="padding: 8px; text-align: right;">${data.costs.rates.pvRate.toFixed(3)} ${data.costs.currency}</td>
            <td style="padding: 8px; text-align: right;">${data.costs.pvCost.toFixed(2)} ${data.costs.currency}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px;">Grundgebühr</td>
            <td style="padding: 8px; text-align: right;">1</td>
            <td style="padding: 8px;">Monat</td>
            <td style="padding: 8px; text-align: right;">${data.costs.baseFee.toFixed(2)} ${data.costs.currency}</td>
            <td style="padding: 8px; text-align: right;">${data.costs.baseFee.toFixed(2)} ${data.costs.currency}</td>
          </tr>
          <tr style="border-top: 1px solid #000; font-weight: bold;">
            <td style="padding: 8px;" colspan="4">Gesamtbetrag:</td>
            <td style="padding: 8px; text-align: right;">${data.costs.totalAmount.toFixed(2)} ${data.costs.currency}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `
}