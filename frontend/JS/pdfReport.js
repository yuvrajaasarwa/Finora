// pdfReport.js - Professional 3-Page Financial Health Report Exporter for Finora
// Uses jsPDF & autoTable to build a vector A4 fintech report with native Unicode (₹) support.

let cachedRobotoBase64 = null;

function isValidTTF(bytes) {
  if (!bytes || bytes.length < 1000) return false;
  // Check TTF (0x00 0x01 0x00 0x00) or OTTO (0x4F 0x54 0x54 0x4F) or wOF (0x77 0x4F 0x46)
  const isTrueType = (bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0);
  const isOpenType = (bytes[0] === 0x4F && bytes[1] === 0x54 && bytes[2] === 0x54 && bytes[3] === 0x4F);
  const isWoff = (bytes[0] === 0x77 && bytes[1] === 0x4F && bytes[2] === 0x46);
  return isTrueType || isOpenType || isWoff;
}

/**
 * Loads and registers the Roboto Unicode font into jsPDF
 * so Indian Rupee (₹) and all standard extended characters render natively without corruption.
 */
async function ensureUnicodeFont(doc) {
  try {
    if (!cachedRobotoBase64 && typeof window !== 'undefined' && window.ROBOTO_FONT_BASE64) {
      cachedRobotoBase64 = window.ROBOTO_FONT_BASE64;
    }
    if (!cachedRobotoBase64) {
      if (typeof window !== 'undefined' && window.fetch) {
        const fontPaths = ['/fonts/Roboto-Regular.ttf', '/fonts/roboto-regular.ttf', '/Fonts/Roboto-Regular.ttf'];
        for (const fontUrl of fontPaths) {
          try {
            const res = await fetch(fontUrl);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              const bytes = new Uint8Array(buf);
              if (isValidTTF(bytes)) {
                let binary = '';
                const chunkSize = 8192;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                  binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
                }
                cachedRobotoBase64 = btoa(binary);
                break;
              } else {
                console.warn(`Font request at ${fontUrl} returned non-TTF binary data.`);
              }
            }
          } catch (e) {
            // Ignore and try next path
          }
        }
      }
    }
    if (cachedRobotoBase64) {
      try {
        doc.addFileToVFS('Roboto-Regular.ttf', cachedRobotoBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold');
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'italic');
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bolditalic');
        doc.setFont('Roboto', 'normal');
        return true;
      } catch (fontErr) {
        console.warn('jsPDF addFont failed, resetting cache:', fontErr);
        cachedRobotoBase64 = null;
      }
    }
  } catch (err) {
    console.warn('Could not load custom Roboto font for jsPDF:', err);
  }
  try { doc.setFont('helvetica', 'normal'); } catch (e) { }
  return false;
}

/**
 * Calculates a transparent, defensible Financial Health Score (0-100)
 * based on savings rate (35%), expense control (25%), goal progress (20%), and habit discipline (20%).
 */
function calculateFinancialHealthScore(summary, goalsList, habitCount, habitsCompleted) {
  const totalIncome = Number(summary.total_income || 0);
  const totalExpense = Number(summary.total_expense || 0);
  const netSavings = Number(summary.net_cash_savings || 0);
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // 1. Savings Rate Score (Max 35)
  let savingsScore = 0;
  if (savingsRate >= 30) savingsScore = 35;
  else if (savingsRate >= 20) savingsScore = 28;
  else if (savingsRate >= 10) savingsScore = 18;
  else if (savingsRate > 0) savingsScore = 10;

  // 2. Expense Control Ratio Score (Max 25)
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 1.0;
  let expenseScore = 0;
  if (expenseRatio <= 0.50) expenseScore = 25;
  else if (expenseRatio <= 0.70) expenseScore = 20;
  else if (expenseRatio <= 0.85) expenseScore = 12;
  else if (expenseRatio <= 1.0) expenseScore = 5;

  // 3. Goal Progression Score (Max 20)
  let goalScore = 10; // neutral baseline if no goals
  if (goalsList && goalsList.length > 0) {
    let totalProg = 0;
    goalsList.forEach(g => {
      const target = Number(g.target_amount || 0);
      const saved = Number(g.saved_amount || 0);
      const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
      totalProg += pct;
    });
    goalScore = Math.round(((totalProg / goalsList.length) / 100) * 20);
  }

  // 4. Habit Accountability Score (Max 20)
  let habitScore = 10; // neutral baseline if no habits
  if (habitCount > 0) {
    habitScore = Math.round(Math.min(1, habitsCompleted / habitCount) * 20);
  }

  const score = Math.min(100, Math.max(0, savingsScore + expenseScore + goalScore + habitScore));
  let label = 'MODERATE';
  if (score >= 80) label = 'EXCELLENT';
  else if (score >= 65) label = 'GOOD';
  else if (score >= 50) label = 'MODERATE';
  else label = 'NEEDS FOCUS';

  return { score, label };
}

async function generateFinancialReportPDF() {
  const triggerBtn = document.getElementById('download-pdf-btn');
  const originalText = triggerBtn ? triggerBtn.innerHTML : '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '⏳ Generating PDF...';
  }

  try {
    // 1. Fetch real-time user data from API
    const [summary, incomeList, expenseList, habitsList, goalsList, investmentsList] = await Promise.all([
      api('/api/analytics/summary'),
      api('/api/income'),
      api('/api/expenses'),
      api('/api/habits'),
      api('/api/goals'),
      api('/api/investments'),
    ]);

    const user = Auth.user || { name: 'Valued Member', email: 'user@finora.app', currency: 'INR' };
    const currency = user.currency || 'INR';

    // Verify jsPDF library availability
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF generator library (jsPDF) is not loaded. Please refresh the page.');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Ensure Unicode font (Roboto) is registered
    const fontLoaded = await ensureUnicodeFont(doc);
    const activeFont = fontLoaded ? 'Roboto' : 'helvetica';

    const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // Color Palette matching fintech reporting
    const colors = {
      navy: [15, 23, 42],
      slate: [30, 41, 59],
      primary: [23, 107, 77], // Finora deep green
      green: [16, 185, 129],
      red: [225, 29, 72],
      amber: [217, 119, 6],
      lightBg: [248, 250, 252],
      cardBorder: [226, 232, 240],
      textDark: [15, 23, 42],
      textMuted: [100, 116, 139],
      white: [255, 255, 255],
    };

    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Helper: Draw Header & Footer template for each page
    function drawPageTemplate(pageNum, totalPages, subtitle) {
      // Header Bar
      doc.setFillColor(...colors.navy);
      doc.rect(0, 0, pageWidth, 22, 'F');

      // Logo Icon & Brand Name
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, 4, 14, 14, 2, 2, 'F');
      doc.setTextColor(...colors.white);
      doc.setFont(activeFont, 'bold');
      doc.setFontSize(11);
      doc.text('F', margin + 5, 13.5);

      doc.setFontSize(13);
      doc.setFont(activeFont, 'bold');
      doc.text('Finora', margin + 18, 11);
      doc.setFontSize(8);
      doc.setFont(activeFont, 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text('Financial Health & Wealth Tracker', margin + 18, 16);

      // Header Right
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text(`CONFIDENTIAL REPORT · ${subtitle.toUpperCase()}`, pageWidth - margin, 11, { align: 'right' });
      doc.text(`Date: ${reportDate}`, pageWidth - margin, 16, { align: 'right' });

      // Footer Separator & Info
      doc.setDrawColor(...colors.cardBorder);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFontSize(8);
      doc.setFont(activeFont, 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text(`Prepared for: ${user.name} (${user.email})`, margin, pageHeight - 7);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    // Key financial metric calculations
    const totalIncome = summary.total_income || 0;
    const totalExpense = summary.total_expense || 0;
    const netSavings = summary.net_cash_savings || 0;
    const netWorth = summary.net_worth || 0;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
    const investmentsVal = summary.investments_current_value || 0;
    const goalsSaved = summary.total_saved_in_goals || 0;
    const habitCount = summary.habit_count || (habitsList ? habitsList.length : 0);
    const habitsCompleted = summary.habits_completed_today || 0;

    // =========================================================================
    // PAGE 1 — FINANCIAL OVERVIEW
    // =========================================================================
    drawPageTemplate(1, 3, 'Executive Financial Overview');
    let y = 30;

    // Page Title Block
    doc.setFontSize(16);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Executive Financial Overview', margin, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont(activeFont, 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text(`Comprehensive financial snapshot and liquidity analysis for ${user.name}.`, margin, y);
    y += 9;

    // Financial Health Score Banner Card
    const health = calculateFinancialHealthScore(summary, goalsList, habitCount, habitsCompleted);
    doc.setFillColor(240, 253, 244); // soft green tint
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, y, 3, 18, 1.5, 1.5, 'F');

    doc.setFontSize(8);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('FINORA FINANCIAL HEALTH SCORE', margin + 7, y + 6);

    doc.setFontSize(13);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text(`${health.score} / 100 · ${health.label}`, margin + 7, y + 13.5);

    doc.setFontSize(7.5);
    doc.setFont(activeFont, 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text('Calculated from savings rate, expense ratio, goal progress & habit streaks.', margin + 75, y + 13.5);

    y += 24;

    // 4 Key Summary Metric Cards Grid (2x2)
    const cardWidth = (contentWidth - 8) / 2;
    const cardHeight = 22;

    const cardsData = [
      { label: 'NET WORTH', val: fmtMoney(netWorth, currency), sub: 'Cash Savings + Investment Assets', color: colors.primary },
      { label: 'MONTHLY INCOME', val: fmtMoney(totalIncome, currency), sub: 'Total Cash Inflows Logged', color: colors.green },
      { label: 'MONTHLY EXPENSES', val: fmtMoney(totalExpense, currency), sub: 'Total Cash Outflows Logged', color: colors.red },
      { label: 'SAVINGS RATE', val: `${savingsRate}%`, sub: `Monthly Savings: ${fmtMoney(netSavings, currency)}`, color: savingsRate >= 20 ? colors.green : colors.amber },
    ];

    cardsData.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = margin + col * (cardWidth + 8);
      const cy = y + row * (cardHeight + 5);

      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(...colors.cardBorder);
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFillColor(...c.color);
      doc.roundedRect(cx, cy, 3, cardHeight, 1.5, 1.5, 'F');

      doc.setFontSize(7.5);
      doc.setFont(activeFont, 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text(c.label, cx + 7, cy + 6);

      doc.setFontSize(12);
      doc.setFont(activeFont, 'bold');
      doc.setTextColor(...colors.textDark);
      doc.text(c.val, cx + 7, cy + 13.5);

      doc.setFontSize(7.5);
      doc.setFont(activeFont, 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text(c.sub, cx + 7, cy + 18.5);
    });

    y += (cardHeight * 2) + 12;

    // Key Financial Position Highlights Table
    doc.setFontSize(11);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Key Financial Position Highlights', margin, y);
    y += 5;

    const highlightsRows = [
      ['Monthly Income', fmtMoney(totalIncome, currency), 'Active Inflow Stream'],
      ['Monthly Expenses', fmtMoney(totalExpense, currency), totalExpense <= totalIncome * 0.7 ? 'Controlled (<70% Inflow)' : 'High Spend (>70% Inflow)'],
      ['Monthly Savings', fmtMoney(netSavings, currency), netSavings > 0 ? 'Positive Surplus' : 'Deficit Alert'],
      ['Investment Assets', fmtMoney(investmentsVal, currency), `${investmentsList ? investmentsList.length : 0} Holdings Tracked`],
      ['Savings Goals Earmarked', fmtMoney(goalsSaved, currency), `${goalsList ? goalsList.length : 0} Active Goals`],
      ['Daily Habit Completion', `${habitsCompleted}/${habitCount} Completed Today`, `${habitCount} Configured Habits`],
    ];

    if (doc.autoTable) {
      doc.autoTable({
        startY: y,
        head: [['Metric / Position Layer', 'Current Balance / Status', 'Benchmark / Indicator']],
        body: highlightsRows,
        theme: 'striped',
        styles: { font: activeFont, fontStyle: 'normal', fontSize: 8.5 },
        headStyles: { font: activeFont, fontStyle: 'bold', fillColor: colors.navy, textColor: colors.white, fontSize: 8.5 },
        bodyStyles: { font: activeFont, fontStyle: 'normal', textColor: colors.textDark },
        alternateRowStyles: { fillColor: colors.lightBg },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Executive Summary Narrative Box with Dynamic Height
    doc.setFontSize(8.5);
    doc.setFont(activeFont, 'normal');
    const summaryMsg = savingsRate >= 20
      ? `Strong financial performance. Your current monthly savings rate of ${savingsRate}% exceeds the standard 20% benchmark. You have accumulated ${fmtMoney(netWorth, currency)} in total net worth across cash savings and investment assets.`
      : `Opportunity for optimization. Your current monthly savings rate is ${savingsRate}%. Focus on trimming discretionary expenses and maintaining daily habit streaks to increase your monthly savings velocity toward the 20%+ target.`;

    const splitSummary = doc.splitTextToSize(summaryMsg, contentWidth - 14);
    const summaryBoxHeight = Math.max(24, 12 + (splitSummary.length * 4.5));

    doc.setFillColor(239, 246, 255); // soft blue tint
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 2, 2, 'FD');

    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, y, 3, summaryBoxHeight, 1.5, 1.5, 'F');

    doc.setFontSize(8.5);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('EXECUTIVE SUMMARY INSIGHT', margin + 7, y + 6.5);

    doc.setFontSize(8.5);
    doc.setFont(activeFont, 'normal');
    doc.setTextColor(...colors.textDark);
    doc.text(splitSummary, margin + 7, y + 13);

    // =========================================================================
    // PAGE 2 — DETAILED BREAKDOWN & CASH FLOW
    // =========================================================================
    doc.addPage();
    drawPageTemplate(2, 3, 'Detailed Breakdown & Cash Flow');
    y = 30;

    doc.setFontSize(14);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Expense Breakdown & Recent Activity', margin, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setFont(activeFont, 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text('Detailed analysis of category spend, recent transactions, savings milestones, and cash dynamics.', margin, y);
    y += 8;

    // 1. Expense Category Breakdown Table
    const catData = (summary.category_breakdown && summary.category_breakdown.length)
      ? summary.category_breakdown.map(c => [
        c.category,
        fmtMoney(c.total, currency),
        `${totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0}%`,
      ])
      : [['General / Miscellaneous', fmtMoney(totalExpense, currency), '100%']];

    if (doc.autoTable) {
      doc.autoTable({
        startY: y,
        head: [['Expense Category', 'Total Amount Spent', 'Share of Outflow']],
        body: catData,
        theme: 'grid',
        styles: { font: activeFont, fontStyle: 'normal', fontSize: 8 },
        headStyles: { font: activeFont, fontStyle: 'bold', fillColor: colors.slate, textColor: colors.white, fontSize: 8 },
        bodyStyles: { font: activeFont, fontStyle: 'normal', textColor: colors.textDark },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // 2. Recent Financial Transactions Table (Top 10)
    doc.setFontSize(11);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Recent Financial Transactions (Top 10)', margin, y);
    y += 5;

    const allTx = [
      ...(incomeList || []).map(i => ({ date: i.date, desc: i.source || 'Income', amount: i.amount, type: 'INCOME' })),
      ...(expenseList || []).map(e => ({ date: e.date, desc: `${e.category}${e.note ? ' - ' + e.note : ''}`, amount: -e.amount, type: 'EXPENSE' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    const txRows = allTx.length ? allTx.map(t => {
      const isInc = t.type === 'INCOME';
      const prefix = isInc ? '+' : '-';
      const formattedVal = `${prefix}${fmtMoney(Math.abs(t.amount), currency)}`;
      const safeDesc = t.desc.length > 40 ? t.desc.slice(0, 37) + '...' : t.desc;
      return [t.date || todayISO(), safeDesc, t.type, formattedVal];
    }) : [['-', 'No recent transactions logged', '-', '-']];

    if (doc.autoTable) {
      doc.autoTable({
        startY: y,
        head: [['Date', 'Description / Category', 'Type', 'Amount']],
        body: txRows,
        theme: 'striped',
        styles: { font: activeFont, fontStyle: 'normal', fontSize: 8 },
        headStyles: { font: activeFont, fontStyle: 'bold', fillColor: colors.navy, textColor: colors.white, fontSize: 8 },
        bodyStyles: { font: activeFont, fontStyle: 'normal', textColor: colors.textDark },
        columnStyles: {
          2: { fontStyle: 'bold' },
          3: { fontStyle: 'bold', halign: 'right' },
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 3) {
            const valStr = String(data.cell.raw || '');
            if (valStr.startsWith('+')) {
              data.cell.styles.textColor = colors.green;
            } else if (valStr.startsWith('-')) {
              data.cell.styles.textColor = colors.red;
            }
          }
        },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // 3. Savings Goals Visual Progress Section
    doc.setFontSize(11);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Savings Goals Progress', margin, y);
    y += 5;

    if (goalsList && goalsList.length > 0) {
      const goalSlice = goalsList.slice(0, 4);
      goalSlice.forEach(g => {
        const target = Number(g.target_amount || 0);
        const saved = Number(g.saved_amount || 0);
        const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;

        doc.setFillColor(...colors.lightBg);
        doc.setDrawColor(...colors.cardBorder);
        doc.roundedRect(margin, y, contentWidth, 15, 1.5, 1.5, 'FD');

        const titleText = g.title.length > 30 ? g.title.slice(0, 27) + '...' : g.title;
        doc.setFontSize(8.5);
        doc.setFont(activeFont, 'bold');
        doc.setTextColor(...colors.textDark);
        doc.text(titleText, margin + 4, y + 5);

        const statText = `${pct}% (${fmtMoney(saved, currency)} / ${fmtMoney(target, currency)})`;
        doc.setFontSize(7.5);
        doc.setFont(activeFont, 'bold');
        doc.setTextColor(...colors.primary);
        doc.text(statText, pageWidth - margin - 4, y + 5, { align: 'right' });

        const barX = margin + 4;
        const barY = y + 8.5;
        const barWidth = contentWidth - 8;
        const barHeight = 3.5;

        doc.setFillColor(226, 232, 240); // Track gray
        doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');

        if (pct > 0) {
          const fillW = Math.max(2, (barWidth * pct) / 100);
          doc.setFillColor(...colors.primary);
          doc.roundedRect(barX, barY, fillW, barHeight, 1, 1, 'F');
        }

        y += 18;
      });
    } else {
      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(...colors.cardBorder);
      doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
      doc.setFontSize(8);
      doc.setFont(activeFont, 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text('No active savings goals set. Create goals in Finora to track targeted savings milestones.', margin + 5, y + 8.5);
      y += 18;
    }

    // 4. Monthly Cash Flow Dynamics Chart Snapshot (Aspect-Ratio Preserved)
    const activeChartCanvas = document.getElementById('cashflow-chart') || document.getElementById('cf-chart');
    if (activeChartCanvas && activeChartCanvas.width > 0 && activeChartCanvas.height > 0) {
      try {
        const chartImgData = activeChartCanvas.toDataURL('image/png', 1.0);
        doc.setFontSize(10);
        doc.setFont(activeFont, 'bold');
        doc.setTextColor(...colors.textDark);
        doc.text('Monthly Cash Flow Dynamics (Chart Snapshot)', margin, y);
        y += 4;

        const ratio = activeChartCanvas.height / activeChartCanvas.width;
        const availableHeight = pageHeight - margin - 15 - y;
        let chartWidth = contentWidth;
        let chartHeight = chartWidth * ratio;

        if (chartHeight > availableHeight) {
          chartHeight = availableHeight;
          chartWidth = chartHeight / ratio;
        }

        if (chartHeight > 15) {
          const chartX = margin + (contentWidth - chartWidth) / 2;
          doc.addImage(chartImgData, 'PNG', chartX, y, chartWidth, chartHeight);
        }
      } catch (e) {
        console.warn('Could not export chart image to PDF:', e);
      }
    }

    // =========================================================================
    // PAGE 3 — AUTOMATED INSIGHTS & RECOMMENDATIONS
    // =========================================================================
    doc.addPage();
    drawPageTemplate(3, 3, 'Insights & Recommendations');
    y = 30;

    doc.setFontSize(14);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Automated Insights & Recommendations', margin, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setFont(activeFont, 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text('Algorithmic analysis derived from your real-time cash flow, habit consistency, and goal trajectory.', margin, y);
    y += 8;

    const insights = [];

    // 1. Spending Concentration Warning
    let highestCat = null;
    let highestCatTotal = 0;
    if (summary.category_breakdown && summary.category_breakdown.length) {
      highestCat = summary.category_breakdown[0].category;
      highestCatTotal = summary.category_breakdown[0].total;
    }

    if (highestCat && totalExpense > 0) {
      const pct = Math.round((highestCatTotal / totalExpense) * 100);
      if (pct > 30) {
        insights.push({
          tag: 'SPENDING WARNING',
          title: `Spending Concentration: ${highestCat}`,
          desc: `Your spending in "${highestCat}" represents ${pct}% of your total monthly expense outflow (${fmtMoney(highestCatTotal, currency)}). Consider establishing a monthly category cap to avoid cash flow strain.`,
          color: colors.red,
        });
      }
    }

    // 2. Savings Discipline
    if (savingsRate >= 30) {
      insights.push({
        tag: 'WEALTH GROWTH',
        title: `Exceptional Savings Discipline (${savingsRate}%)`,
        desc: `You are retaining ${savingsRate}% of your total monthly earnings. Consider channeling surplus liquid cash flow into compounding investment assets to accelerate long-term net worth growth.`,
        color: colors.green,
      });
    } else if (savingsRate >= 15) {
      insights.push({
        tag: 'OPTIMIZATION',
        title: `Good Cash Retention (${savingsRate}%)`,
        desc: `You are retaining ${savingsRate}% of monthly earnings. To reach financial independence milestones faster, aim to optimize variable recurring expenses by 5-10% next month.`,
        color: colors.primary,
      });
    } else {
      insights.push({
        tag: 'ACTION REQUIRED',
        title: `Low Savings Margin (${savingsRate}%)`,
        desc: `Your current monthly savings rate is below the recommended 20% benchmark. Review non-essential spending categories and automate daily savings habits to build a stronger buffer.`,
        color: colors.red,
      });
    }

    // 3. Habit Streak Consistency
    if (habitCount === 0) {
      insights.push({
        tag: 'HABIT SYSTEM',
        title: 'Habit Accountability Inactive',
        desc: 'You haven\'t configured any daily financial habits. Setting up simple daily tracking habits (e.g., "Log cash expenses", "Review daily spend") reinforces long-term financial discipline.',
        color: colors.amber,
      });
    } else {
      insights.push({
        tag: 'HABIT STREAK',
        title: `Habit Streak Progress (${habitsCompleted}/${habitCount} Done Today)`,
        desc: `Daily financial habits drive sustained wealth creation. Maintain your streak consistency without breaking the chain to automate financial control.`,
        color: colors.green,
      });
    }

    // 4. Simple 12-Month Net Worth Projection
    const projectedNetWorthIn1Year = Math.round(netWorth + (netSavings * 12));
    insights.push({
      tag: 'PROJECTION',
      title: 'Simple 12-Month Net Worth Projection',
      desc: `At your current monthly savings velocity of ${fmtMoney(netSavings, currency)}, your net worth is projected to reach approximately ${fmtMoney(projectedNetWorthIn1Year, currency)} in 12 months. NOTE: This is a simple projection assuming current monthly savings remain constant. It does NOT account for investment market returns, inflation, taxes, or future changes in income and expenses.`,
      color: colors.primary,
    });

    // Render Insights Cards with Dynamic Heights & Crisp Text Wrapping
    insights.forEach((ins) => {
      doc.setFontSize(8.5);
      doc.setFont(activeFont, 'normal');
      const splitDesc = doc.splitTextToSize(ins.desc, contentWidth - 14);
      const cardHeight = Math.max(22, 13 + (splitDesc.length * 4.2));

      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(...colors.cardBorder);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

      doc.setFillColor(...ins.color);
      doc.roundedRect(margin, y, 3, cardHeight, 1.5, 1.5, 'F');

      doc.setFontSize(7.5);
      doc.setFont(activeFont, 'bold');
      doc.setTextColor(...ins.color);
      const tagText = `[${ins.tag}]`;
      doc.text(tagText, margin + 7, y + 6);

      const tagWidth = doc.getTextWidth(tagText);
      doc.setFontSize(9);
      doc.setFont(activeFont, 'bold');
      doc.setTextColor(...colors.textDark);
      doc.text(ins.title, margin + 12 + tagWidth, y + 6);

      doc.setFontSize(8.5);
      doc.setFont(activeFont, 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text(splitDesc, margin + 7, y + 13);

      y += cardHeight + 5;
    });

    // Legal Financial Disclaimer Box anchored cleanly at bottom
    const disclaimerY = pageHeight - 42;
    doc.setFillColor(254, 243, 199); // soft amber
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(margin, disclaimerY, contentWidth, 26, 2, 2, 'FD');

    doc.setFillColor(217, 119, 6);
    doc.roundedRect(margin, disclaimerY, 3, 26, 1.5, 1.5, 'F');

    doc.setFontSize(8);
    doc.setFont(activeFont, 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('[LEGAL FINANCIAL DISCLAIMER]', margin + 7, disclaimerY + 6.5);

    doc.setFontSize(7.5);
    doc.setFont(activeFont, 'normal');
    doc.setTextColor(120, 53, 15);
    const disclaimerText = 'This financial report is generated automatically by Finora based on user-entered financial logs. It does not constitute certified investment advice, tax counseling, or formal financial planning. Always consult an accredited financial professional before executing major financial decisions.';
    const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 14);
    doc.text(splitDisclaimer, margin + 7, disclaimerY + 13);

    // Save PDF
    const filename = `Finora_Financial_Report_${user.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);

    if (window.showToast) {
      window.showToast('Financial Report (PDF) downloaded successfully!', 'success');
    }
  } catch (err) {
    console.error('PDF Generation Error:', err);
    alert(`Failed to generate PDF Report: ${err.message}`);
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = originalText;
    }
  }
}
