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
  yearlyConsumption?: {
    currentYear: number
    previousYear?: number
    currentYearProjection: number
    isYearComplete: boolean
  }
  provider?: {
    name: string
    address: string
    energyMix: {
      solarEnergyPct: number
      windEnergyPct: number
      nuclearEnergyPct: number
      coalEnergyPct: number
      gasEnergyPct: number
      miscFossilEnergyPct: number
      miscRenewableEnergyPct: number
    }
  }
}

function generateConsumptionChart(yearlyConsumption?: InvoiceData['yearlyConsumption']): string {
  if (!yearlyConsumption) return ''

  const benchmarks = {
    1: [615, 1230, 1845, 2460],
    2: [1032, 2064, 3096, 4128],
    3: [1215, 2430, 3645, 4860],
    4: [1482, 2964, 4446, 5928]
  }

  const levels = ['Fantastischer Verbrauch', 'Gut', 'Durchschnitt', 'Viel zu hoch']
  const colors = ['#4ade80', '#22d3ee', '#f59e0b', '#ef4444'] // green, cyan, amber, red

  const maxValue = Math.max(
    yearlyConsumption.currentYear,
    yearlyConsumption.previousYear || 0,
    yearlyConsumption.currentYearProjection,
    ...Object.values(benchmarks).flat()
  )

  const chartHeight = 300
  const chartWidth = 800
  const barWidth = 80
  const spacing = 15

  const startX = 50

  function getBarHeight(value: number): number {
    return (value / maxValue) * (chartHeight - 100)
  }

  let svgContent = `
    <svg width="${chartWidth}" height="${chartHeight + 50}" xmlns="http://www.w3.org/2000/svg">
      <!-- Chart Title -->
      <text x="${chartWidth/2}" y="25" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" fill="#000">
        Ihr Stromverbrauch im Vergleich
      </text>

      <!-- Grid lines -->
      ${Array.from({length: 6}, (_, i) => {
        const y = chartHeight - 20 - (i * (chartHeight - 100) / 5)
        const value = Math.round((maxValue * i) / 5)
        return `
          <line x1="${startX - 10}" y1="${y}" x2="${chartWidth - 50}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
          <text x="${startX - 15}" y="${y + 4}" font-family="Arial" font-size="10" text-anchor="end" fill="#6b7280">${value}</text>
        `
      }).join('')}

      <text x="25" y="${chartHeight/2}" font-family="Arial" font-size="10" text-anchor="middle" fill="#6b7280" transform="rotate(-90 25 ${chartHeight/2})">kWh/Jahr</text>
  `

  let currentX = startX

  // Previous year bar
  if (yearlyConsumption.previousYear) {
    const height = getBarHeight(yearlyConsumption.previousYear)
    svgContent += `
      <rect x="${currentX}" y="${chartHeight - 20 - height}" width="${barWidth}" height="${height}" fill="#9ca3af"/>
      <text x="${currentX + barWidth/2}" y="${chartHeight - 5}" font-family="Arial" font-size="10" text-anchor="middle" fill="#000">Vorjahr</text>
      <text x="${currentX + barWidth/2}" y="${chartHeight - 20 - height - 5}" font-family="Arial" font-size="10" text-anchor="middle" fill="#000">${yearlyConsumption.previousYear}</text>
    `
    currentX += barWidth + spacing
  }

  // Current year bar with projection
  const currentHeight = getBarHeight(yearlyConsumption.currentYear)
  const projectionHeight = getBarHeight(yearlyConsumption.currentYearProjection)

  svgContent += `
    <!-- Current year actual -->
    <rect x="${currentX}" y="${chartHeight - 20 - currentHeight}" width="${barWidth}" height="${currentHeight}" fill="#3b82f6"/>

    <!-- Projection if year not complete -->
    ${!yearlyConsumption.isYearComplete ? `
      <rect x="${currentX}" y="${chartHeight - 20 - projectionHeight}" width="${barWidth}" height="${projectionHeight - currentHeight}" fill="#3b82f6" opacity="0.5"/>
      <line x1="${currentX}" y1="${chartHeight - 20 - currentHeight}" x2="${currentX + barWidth}" y2="${chartHeight - 20 - currentHeight}" stroke="#1e40af" stroke-width="2" stroke-dasharray="5,5"/>
    ` : ''}

    <text x="${currentX + barWidth/2}" y="${chartHeight - 5}" font-family="Arial" font-size="10" text-anchor="middle" fill="#000">${yearlyConsumption.isYearComplete ? 'Aktuelles Jahr' : 'Aktuell/Prognose'}</text>
    <text x="${currentX + barWidth/2}" y="${chartHeight - 20 - Math.max(currentHeight, projectionHeight) - 5}" font-family="Arial" font-size="10" text-anchor="middle" fill="#000">${yearlyConsumption.isYearComplete ? yearlyConsumption.currentYear : yearlyConsumption.currentYearProjection}</text>
  `
  currentX += barWidth + spacing * 2

  // Benchmark bars for 1-4 persons
  Object.entries(benchmarks).forEach(([persons, values]) => {
    let yOffset = chartHeight - 20

    values.forEach((value, levelIndex) => {
      const segmentHeight = getBarHeight(value) / values.length
      svgContent += `
        <rect x="${currentX}" y="${yOffset - segmentHeight}" width="${barWidth * 0.8}" height="${segmentHeight}" fill="${colors[levelIndex]}"/>
      `
      yOffset -= segmentHeight
    })

    // Labels
    svgContent += `
      <text x="${currentX + (barWidth * 0.8)/2}" y="${chartHeight - 5}" font-family="Arial" font-size="10" text-anchor="middle" fill="#000">${persons} Person${persons === '1' ? '' : 'en'}</text>
      <text x="${currentX + (barWidth * 0.8)/2}" y="${chartHeight - 20 - getBarHeight(values[values.length - 1]) - 5}" font-family="Arial" font-size="9" text-anchor="middle" fill="#000">${values[values.length - 1]}</text>
    `

    currentX += barWidth + spacing
  })

  // Legend
  svgContent += `
    <!-- Legend -->
    <g transform="translate(${chartWidth - 200}, 60)">
      <text x="0" y="0" font-family="Arial" font-size="11" font-weight="bold" fill="#000">Bewertung:</text>
      ${levels.map((level, i) => `
        <rect x="0" y="${15 + i * 20}" width="12" height="12" fill="${colors[i]}"/>
        <text x="18" y="${25 + i * 20}" font-family="Arial" font-size="10" fill="#000">${level}</text>
      `).join('')}
    </g>
  `

  svgContent += '</svg>'

  return svgContent
}

function createPieSlice(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): string {
  const x1 = centerX + radius * Math.cos(startAngle)
  const y1 = centerY + radius * Math.sin(startAngle)
  const x2 = centerX + radius * Math.cos(endAngle)
  const y2 = centerY + radius * Math.sin(endAngle)
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
}

function generateGridVsPvPieChart(gridKwh: number, pvKwh: number): string {
  if (gridKwh === 0 && pvKwh === 0) return ''

  const total = gridKwh + pvKwh
  const gridPercentage = (gridKwh / total) * 100
  const pvPercentage = (pvKwh / total) * 100

  const centerX = 100
  const centerY = 100
  const radius = 80

  // Convert percentages to radians
  const gridAngle = (gridKwh / total) * 2 * Math.PI
  const pvAngle = (pvKwh / total) * 2 * Math.PI

  let currentAngle = -Math.PI / 2 // Start at top

  const gridPath = createPieSlice(centerX, centerY, radius, currentAngle, currentAngle + gridAngle)
  currentAngle += gridAngle

  const pvPath = createPieSlice(centerX, centerY, radius, currentAngle, currentAngle + pvAngle)

  return `
    <svg width="200" height="250" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="${gridPath}" fill="#ef4444" stroke="#fff" stroke-width="2"/>
        <path d="${pvPath}" fill="#22c55e" stroke="#fff" stroke-width="2"/>
      </g>

      <!-- Legend -->
      <g transform="translate(20, 210)">
        <rect x="0" y="0" width="12" height="12" fill="#ef4444"/>
        <text x="18" y="10" font-family="Arial" font-size="10" fill="#000">Netzstrom (${gridPercentage.toFixed(1)}%)</text>

        <rect x="100" y="0" width="12" height="12" fill="#22c55e"/>
        <text x="118" y="10" font-family="Arial" font-size="10" fill="#000">PV-Strom (${pvPercentage.toFixed(1)}%)</text>
      </g>

      <!-- Title -->
      <text x="100" y="20" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#000">
        Stromverbrauch nach Quelle
      </text>
    </svg>
  `
}

function generateEnergyMixPieChart(energyMix: InvoiceData['provider']['energyMix']): string {
  if (!energyMix) return ''

  const energyTypes = [
    { name: 'Solar', value: energyMix.solarEnergyPct, color: '#fbbf24' },
    { name: 'Wind', value: energyMix.windEnergyPct, color: '#60a5fa' },
    { name: 'Kernenergie', value: energyMix.nuclearEnergyPct, color: '#8b5cf6' },
    { name: 'Kohle', value: energyMix.coalEnergyPct, color: '#6b7280' },
    { name: 'Gas', value: energyMix.gasEnergyPct, color: '#f97316' },
    { name: 'Fossil (Sonstige)', value: energyMix.miscFossilEnergyPct, color: '#991b1b' },
    { name: 'Erneuerbar (Sonstige)', value: energyMix.miscRenewableEnergyPct, color: '#059669' }
  ].filter(type => type.value > 0)

  if (energyTypes.length === 0) return ''

  const centerX = 100
  const centerY = 100
  const radius = 80

  let currentAngle = -Math.PI / 2 // Start at top
  let pathElements = ''
  let legendElements = ''

  energyTypes.forEach((energyType, index) => {
    const sliceAngle = (energyType.value / 100) * 2 * Math.PI
    const path = createPieSlice(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)

    pathElements += `<path d="${path}" fill="${energyType.color}" stroke="#fff" stroke-width="2"/>\n`

    // Legend positioning
    const legendY = index * 15
    legendElements += `
      <rect x="0" y="${legendY}" width="12" height="12" fill="${energyType.color}"/>
      <text x="18" y="${legendY + 10}" font-family="Arial" font-size="9" fill="#000">${energyType.name} (${energyType.value.toFixed(1)}%)</text>
    `

    currentAngle += sliceAngle
  })

  return `
    <svg width="240" height="280" xmlns="http://www.w3.org/2000/svg">
      <g>
        ${pathElements}
      </g>

      <!-- Legend -->
      <g transform="translate(20, 210)">
        ${legendElements}
      </g>

      <!-- Title -->
      <text x="100" y="20" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#000">
        Strommix Ihres Anbieters
      </text>
    </svg>
  `
}

function generateEnvironmentalImpactChart(year: number): string {
  const chartWidth = 600
  const chartHeight = 300
  const barHeight = 40
  const barSpacing = 80
  const startY = 60

  // Static data
  const data = {
    co2: {
      musterprodukt: { value: 199, percentage: 38, unit: 'g/kWh' },
      musteranbieter: { value: 503, percentage: 97, unit: 'g/kWh' }
    },
    waste: {
      musterprodukt: { value: 0, percentage: 0, unit: 'mg/kWh' },
      musteranbieter: { value: 0.46, percentage: 66, unit: 'mg/kWh' }
    }
  }

  const maxPercentage = Math.max(
    data.co2.musteranbieter.percentage,
    data.waste.musteranbieter.percentage
  )
  const barMaxWidth = 300

  function getBarWidth(percentage: number): number {
    return (percentage / maxPercentage) * barMaxWidth
  }

  return `
    <svg width="${chartWidth}" height="${chartHeight + 50}" xmlns="http://www.w3.org/2000/svg">
      <!-- Title -->
      <text x="${chartWidth/2}" y="25" font-family="Arial" font-size="14" font-weight="bold" text-anchor="middle" fill="#000">
        Umweltbelastung aus der Stromerzeugung ${year}
      </text>

      <!-- CO2 Emissions Section -->
      <text x="50" y="${startY}" font-family="Arial" font-size="12" font-weight="bold" fill="#000">
        CO₂-Emissionen:
      </text>

      <!-- Musterprodukt CO2 Bar -->
      <rect x="50" y="${startY + 10}" width="${getBarWidth(data.co2.musterprodukt.percentage)}" height="${barHeight}" fill="#22c55e"/>
      <text x="60" y="${startY + 32}" font-family="Arial" font-size="10" fill="#fff" font-weight="bold">Musterprodukt</text>
      <text x="${60 + getBarWidth(data.co2.musterprodukt.percentage)}" y="${startY + 32}" font-family="Arial" font-size="10" fill="#000">
        ${data.co2.musterprodukt.value} ${data.co2.musterprodukt.unit} (${data.co2.musterprodukt.percentage}% des Durchschnitts)
      </text>

      <!-- Musteranbieter CO2 Bar -->
      <rect x="50" y="${startY + 50}" width="${getBarWidth(data.co2.musteranbieter.percentage)}" height="${barHeight}" fill="#ef4444"/>
      <text x="60" y="${startY + 72}" font-family="Arial" font-size="10" fill="#fff" font-weight="bold">Musteranbieter</text>
      <text x="${60 + getBarWidth(data.co2.musteranbieter.percentage)}" y="${startY + 72}" font-family="Arial" font-size="10" fill="#000">
        ${data.co2.musteranbieter.value} ${data.co2.musteranbieter.unit} (${data.co2.musteranbieter.percentage}% des Durchschnitts)
      </text>

      <!-- Radioactive Waste Section -->
      <text x="50" y="${startY + 110}" font-family="Arial" font-size="12" font-weight="bold" fill="#000">
        Radioaktiver Abfall:
      </text>

      <!-- Musterprodukt Waste Bar -->
      <rect x="50" y="${startY + 120}" width="${Math.max(getBarWidth(data.waste.musterprodukt.percentage), 2)}" height="${barHeight}" fill="#22c55e"/>
      <text x="60" y="${startY + 142}" font-family="Arial" font-size="10" fill="${data.waste.musterprodukt.percentage > 10 ? '#fff' : '#000'}" font-weight="bold">Musterprodukt</text>
      <text x="${60 + Math.max(getBarWidth(data.waste.musterprodukt.percentage), 80)}" y="${startY + 142}" font-family="Arial" font-size="10" fill="#000">
        ${data.waste.musterprodukt.value} ${data.waste.musterprodukt.unit} (${data.waste.musterprodukt.percentage}% des Durchschnitts)
      </text>

      <!-- Musteranbieter Waste Bar -->
      <rect x="50" y="${startY + 160}" width="${getBarWidth(data.waste.musteranbieter.percentage)}" height="${barHeight}" fill="#ef4444"/>
      <text x="60" y="${startY + 182}" font-family="Arial" font-size="10" fill="#fff" font-weight="bold">Musteranbieter</text>
      <text x="${60 + getBarWidth(data.waste.musteranbieter.percentage)}" y="${startY + 182}" font-family="Arial" font-size="10" fill="#000">
        ${data.waste.musteranbieter.value} ${data.waste.musteranbieter.unit} (${data.waste.musteranbieter.percentage}% des Durchschnitts)
      </text>

      <!-- Legend -->
      <g transform="translate(50, ${startY + 220})">
        <text x="0" y="0" font-family="Arial" font-size="9" fill="#666">
          100% = Durchschnitt Deutschland
        </text>

        <rect x="200" y="-8" width="12" height="12" fill="#22c55e"/>
        <text x="218" y="2" font-family="Arial" font-size="9" fill="#000">Musterprodukt</text>

        <rect x="320" y="-8" width="12" height="12" fill="#ef4444"/>
        <text x="338" y="2" font-family="Arial" font-size="9" fill="#000">Musteranbieter</text>
      </g>

      <!-- Reference Line for 100% -->
      <line x1="${50 + getBarWidth(100)}" y1="${startY + 5}" x2="${50 + getBarWidth(100)}" y2="${startY + 200}" stroke="#999" stroke-width="1" stroke-dasharray="5,5"/>
      <text x="${50 + getBarWidth(100) + 5}" y="${startY + 20}" font-family="Arial" font-size="8" fill="#666">100%</text>
    </svg>
  `
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const startDate = new Date(data.period.startDate).toLocaleDateString('de-DE')
  const endDate = new Date(data.period.endDate).toLocaleDateString('de-DE')
  const generatedDate = new Date(data.generatedAt).toLocaleDateString('de-DE')
  const contractDate = '01.01.2024' // Mock contract date

  // Calculate proportional Abschlagszahlung
  const startDateObj = new Date(data.period.startDate)
  const endDateObj = new Date(data.period.endDate)
  const periodDays = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
  const monthlyAbschlag = 50.00
  const proportionalAbschlag = (periodDays / 30) * monthlyAbschlag
  const totalAbschlagPayments = Math.floor(periodDays / 30) * monthlyAbschlag + (periodDays % 30 / 30) * monthlyAbschlag

  // Calculate Erstattungsbetrag (refund or additional payment)
  const erstattungsbetrag = totalAbschlagPayments - data.costs.totalAmount

  // Generate random starting meter reading
  const randomStart = Math.floor(Math.random() * 2000) + 1000
  const meterStart = randomStart
  const meterEnd = meterStart + data.consumption.totalKwh

  // Mock customer number based on user ID
  const customerNumber = data.user.id || '20240101-01'

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
          padding: 10px 0 0 0;
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
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .summary-table td {
          padding: 5px 8px;
          border-bottom: 1px dotted #ccc;
        }
        .summary-table .label {
          text-align: left;
        }
        .summary-table .amount {
          text-align: right;
          width: 100px;
        }
        .details-header {
          font-weight: bold;
          font-size: 12pt;
          margin: 30px 0 15px 0;
          border-bottom: 2px solid #000;
          padding-bottom: 5px;
        }
        .details-section {
          margin: 15px 0;
          font-size: 10pt;
        }
        .consumption-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 10pt;
        }
        .consumption-table th,
        .consumption-table td {
          padding: 8px;
          border: 1px solid #000;
          text-align: center;
        }
        .consumption-table th {
          background-color: #f0f0f0;
          font-weight: bold;
        }

        /* Print header and footer styles */
        @page {
          margin: 70px 25mm;

          @top-left {
            content: "RoofShare Energy GmbH - Stromrechnung ${data.invoiceNumber}";
            font-family: Arial, sans-serif;
            font-size: 8pt;
            color: #999;
            border-bottom: 1px solid #eee;
            padding-bottom: 3px;
            width: calc(210mm - 50mm);
          }

          @bottom-right {
            content: counter(page) "/" counter(pages);
            font-family: Arial, sans-serif;
            font-size: 8pt;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 3px;
            width: calc(210mm - 50mm);
            text-align: right;
          }
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
        </tbody>
      </table>

      <!-- Summary Section -->
      <table class="summary-table">
        <tr>
          <td class="label">Abschlagszahlungen (${Math.ceil(periodDays/30)} × 50,00 €)</td>
          <td class="amount">${totalAbschlagPayments.toFixed(2)} €</td>
        </tr>
        <tr>
          <td class="label">Rechnungsbetrag</td>
          <td class="amount">${data.costs.totalAmount.toFixed(2)} €</td>
        </tr>
      </table>

      <div class="content-section">
        <p><strong>Hinweis:</strong> Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.</p>
        ${erstattungsbetrag > 0 ? `
          <p>Der sich ergebende Erstattungsbetrag in Höhe von ${erstattungsbetrag.toFixed(2)} € wird innerhalb der nächsten Werktage auf das von Ihnen hinterlegte Konto überwiesen.</p>
        ` : `
          <p>Der sich ergebende Nachzahlungsbetrag in Höhe von ${Math.abs(erstattungsbetrag).toFixed(2)} € wird in den kommenden Tagen von Ihrem hinterlegten Konto eingezogen.</p>
        `}
        <p>Eine detaillierte Abrechnung mit weitergehenden Informationen haben wir Ihnen auf den nächsten Seite beigefügt.</p>
        <p>Mit freundlichen Grüßen</p>
      </div>

      <!-- Detailed Billing Section -->
      <div class="details-header">Details zu Ihrer Stromrechnung</div>

      <div class="details-section">
        <p><strong>Kundennummer:</strong> ${customerNumber}</p>
        <p><strong>Verbrauchsstelle:</strong> ${data.user.address}</p>
        <p><strong>Entnahmestelle:</strong> DE012345678901234567</p>
        <p><strong>Zählernummer:</strong> ${Math.floor(Math.random() * 90000000) + 10000000}</p>
        <p><strong>Netzbetreiber:</strong> Netz Musterstadt GmbH (987654)</p>
        <p><strong>Messstellenbetreiber:</strong> Netz Musterstadt GmbH oder Private Untermessung</p>
      </div>

      <!-- Consumption Table -->
      <div class="details-section">
        <p><strong>Verbrauchsermittlung:</strong></p>
        <p style="font-style: italic; font-size: 9pt;">(Die Verbrauchsdaten wurden automatisiert über das Messsystem erfasst.)</p>

        <table class="consumption-table">
          <thead>
            <tr>
              <th>Zeitraum</th>
              <th>Anfangszählerstand</th>
              <th>Endzählerstand</th>
              <th>Verbrauch</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${startDate} – ${endDate}</td>
              <td>${meterStart.toFixed(0)} kWh</td>
              <td>${meterEnd.toFixed(0)} kWh</td>
              <td>${data.consumption.totalKwh.toFixed(0)} kWh</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Price Components -->
      <div class="details-section">
        <p><strong>Strompreisbestandteile:</strong></p>
        <p>Der Arbeitspreis in Höhe von 0,29 €/kWh brutto ist ein pauschaler Vollpreis für den lokal erzeugten PV-Strom inklusive Messkosten und Abrechnung – ohne Stromsteuer, Netzentgelte oder Umlagen gemäß § 9 Abs. 1 Nr. 3 StromStG.</p>
        <p><strong>Neue monatliche Abschlagszahlung ab ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('de-DE', {month: 'long', year: 'numeric'})}:</strong> 50,00 €</p>
      </div>

      <!-- Additional Information -->
      <div class="details-section">
        <p><strong>Hinweise:</strong></p>
        <p>Vertragslaufzeit: unbefristet, monatlich kündbar.</p>
        <p>Verbrauchsvergleich, Strommix und Schlichtungsstellen-Hinweise werden separat als Anhang beigefügt (z. B. grafische Darstellungen gemäß § 42 EnWG).</p>
        <p><strong>Hinweis:</strong> Die Zählerstände wurden automatisiert ausgelesen und müssen nicht manuell gemeldet werden.</p>
        <p><strong>Ihr Stromverbrauch im Vergleich</strong> (§ 40 Abs. 2 Satz 1 Nr. 7, 8 EnWG) zum Vorjahreszeitraum sowie zu Vergleichskundengruppen:</p>
      </div>

      <!-- Consumption Chart -->
      ${data.yearlyConsumption ? `
      <div style="margin-top: 40px;">
        <div style="text-align: center; margin-bottom: 20px;">
          ${generateConsumptionChart(data.yearlyConsumption)}
        </div>

        <div class="details-section" style="margin-top: 20px; font-size: 10pt;">
          <p><strong>Erläuterungen zum Verbrauchsvergleich:</strong></p>
          <ul style="padding-left: 20px;">
            <li><strong>Vorjahr:</strong> Ihr tatsächlicher Verbrauch im Vergleichszeitraum des Vorjahres</li>
            ${!data.yearlyConsumption.isYearComplete ? `
            <li><strong>Aktuell/Prognose:</strong> Bisheriger Verbrauch (solide) und Hochrechnung auf das Gesamtjahr (gepunktet)</li>
            ` : `
            <li><strong>Aktuelles Jahr:</strong> Ihr tatsächlicher Jahresverbrauch</li>
            `}
            <li><strong>Vergleichswerte:</strong> Durchschnittlicher Jahresverbrauch nach Haushaltsgröße</li>
            <li>Die Vergleichswerte basieren auf statistischen Erhebungen für deutsche Haushalte</li>
          </ul>

          ${!data.yearlyConsumption.isYearComplete ? `
          <p style="margin-top: 15px; font-style: italic; color: #666;">
            <strong>Hinweis:</strong> Da das Jahr noch nicht abgeschlossen ist, wird eine Hochrechnung basierend auf Ihrem bisherigen Verbrauchsverhalten angezeigt.
            Bei gleichbleibendem Verbrauch würden Sie voraussichtlich ${data.yearlyConsumption.currentYearProjection} kWh im Jahr verbrauchen.
          </p>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Pie Charts Section -->
      <div style="margin-top: 40px;">
        <h2 style="text-align: center; margin-bottom: 20px; font-size: 14pt;">Energieverteilung</h2>

        <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
          <!-- Grid vs PV Chart -->
          <div style="text-align: center;">
            ${generateGridVsPvPieChart(data.consumption.gridKwh, data.consumption.pvKwh)}
          </div>

          <!-- Energy Mix Chart -->
          ${data.provider?.energyMix ? `
          <div style="text-align: center;">
            ${generateEnergyMixPieChart(data.provider.energyMix)}
          </div>
          ` : ''}
        </div>

        <div class="details-section" style="margin-top: 20px; font-size: 10pt;">
          <p><strong>Erläuterungen zur Energieverteilung:</strong></p>
          <ul style="padding-left: 20px;">
            <li><strong>Stromverbrauch nach Quelle:</strong> Zeigt den Anteil von Netzstrom und PV-Strom an Ihrem Gesamtverbrauch im Abrechnungszeitraum</li>
            ${data.provider?.energyMix ? `
            <li><strong>Strommix Ihres Anbieters:</strong> Zeigt die Zusammensetzung des Netzstroms nach Energiequellen basierend auf den Angaben Ihres Energieversorgers</li>
            <li>Die Daten zum Strommix basieren auf den aktuellen Angaben des Energieversorgers und können sich ändern</li>
            ` : ''}
          </ul>
        </div>
      </div>

      <!-- Environmental Impact Chart -->
      <div style="margin-top: 40px;">
        <div style="text-align: center; margin-bottom: 20px;">
          ${generateEnvironmentalImpactChart(new Date().getFullYear() - 1)}
        </div>

        <div style="text-align: center; margin-top: 5px; margin-bottom: 20px;">
          <p style="font-size: 8pt; color: #666;">Stromkennzeichnung gemäß § 42 des Energiewirtschaftsgesetzes. Quelle: Bundesnetzagentur.</p>
        </div>

        <!-- Regulatory Information -->
        <h3 style="font-size: 12pt; font-weight: bold; margin-top: 30px; margin-bottom: 15px;">Allgemeine Hinweise</h3>

        <div class="details-section" style="font-size: 9pt; line-height: 1.3;">

          <p><strong>Informationen über Kontaktstellen zur Beratung in Energieangelegenheiten (§ 40 Abs. 2 Nr. 11 EnWG):</strong></p>

          <p><strong>Hinweise zur Verfügbarkeit und den Möglichkeiten eines Lieferantenwechsels (§ 40 Abs. 2 Nr. 12 EnWG):</strong> Ein Lieferantenwechsel ist möglich, das Verfahren muss individuell abgesprochen werden.</p>

          <p>Zum Preisvergleich der Vertragsangebote der Stromlieferanten werden bei der Bundesnetzagentur mit einem Vertrauenszeichen nach § 41c EnWG versehene Preisvergleichsinstrumente zur Verfügung stehen, sobald bzw. sofern die Bundesnetzagentur diese gesetzliche Anforderung umgesetzt hat.</p>

          <p><strong>Ihre Einschlägige Tarif- und Produktbezeichnung lautet:</strong> Mieterstrom</p>

          <p>Die Stromlieferung ist außerhalb der Grundversorgung erfolgt.</p>

          <p><strong>Hinweis zu Streitbeilegungsverfahren (§ 40 Abs. 2 Satz 1 Nr. 8 EnWG):</strong></p>
          <p>Der Strombezieher hat das Recht, sich jederzeit mit seinen Beanstandungen insbesondere zum Vertragsabschluss oder zur Qualität von Leistungen des Stromlieferanten, die den Anschluss an das Versorgungsnetz, die Belieferung mit Energie sowie die Messung der Energie betreffen, an diesen direkt unter [Kontaktdaten Stromlieferant] zu wenden.</p>

          <p>Hilft der Stromlieferant der Beschwerde nicht binnen einer Frist von vier Wochen ab, kann der Strombezieher ein Schlichtungsverfahren nach § 111b EnWG bei der nachfolgende Stelle einleiten: Schlichtungsstelle Energie e.V., Friedrichstraße 133, 10117 Berlin, Telefon: 030/27572400, E-Mail: info@schlichtungsstelle-energie.de, Web: http://www.schlichtungsstelle-energie.de.</p>

          <p>Die Einzelheiten des Streitschlichtungsverfahrens sind in der Verfahrensordnung des Vereins Schlichtungsstelle Energie e.V. vom 19.09.2011 geregelt und abrufbar unter http://www.schlichtungsstelle-energie.de/.</p>

          <p><strong>Hinweis zum Verbraucherservice (§ 40 Abs. 2 Nr. 10 EnWG):</strong></p>
          <p>Allgemeine Informationen zu Verbraucherrechten im Zusammenhang mit der Energielieferung sind erhältlich über den Verbraucherservice der Bundesnetzagentur für den Bereich Elektrizität und Gas, Postfach 8001, 53105 Bonn, Telefon: 030/ 22480-500 oder 0180 5 101000 (Festnetzpreis 14 ct/min; Mobilfunkpreise maximal 42 ct/min; Mo. - Fr. 9:00 Uhr - 15:00 Uhr), Fax: 030/ 22480-323, E-Mail: verbraucherservice-energie@bnetza.de.</p>
        </div>
      </div>
    </body>
    </html>
  `
}