// pdfReport.js - Professional 3-Page Financial Report Exporter for WealthPulse
// Uses jsPDF & autoTable to build a vector A4 report

async function generateFinancialReportPDF() {
  const triggerBtn = document.getElementById('download-pdf-btn');
  const originalText = triggerBtn ? triggerBtn.innerHTML : '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '⏳ Generating PDF...';
  }

  try {
    // 1. Fetch real-time data from API
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

    // Verify jsPDF availability
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('PDF generator library (jsPDF) is not loaded. Please refresh the page.');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // Color Palette matching fintech reporting
    const colors = {
      navy: [15, 23, 42],
      slate: [30, 41, 59],
      primary: [23, 107, 77], // Finora deep forest green accent
      green: [16, 185, 129],
      red: [244, 63, 94],
      amber: [245, 158, 11],
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

    // Helper: Draw Header & Footer for pages
    function drawPageTemplate(pageNum, totalPages, title) {
      // Header Bar
      doc.setFillColor(...colors.navy);
      doc.rect(0, 0, pageWidth, 22, 'F');

      // Brand Logo & Title
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, 4, 14, 14, 2, 2, 'F');
      doc.setTextColor(...colors.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('F', margin + 5, 13.5);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Finora', margin + 18, 11);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text('Financial Habit Builder & Wealth Growth Tracker', margin + 18, 16);

      // Report Header Right
      doc.setFontSize(8);
      doc.setTextColor(226, 232, 240);
      doc.text(`CONFIDENTIAL REPORT · ${title.toUpperCase()}`, pageWidth - margin, 11, { align: 'right' });
      doc.text(`Date: ${reportDate}`, pageWidth - margin, 16, { align: 'right' });

      // Footer
      doc.setDrawColor(...colors.cardBorder);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      doc.setFontSize(8);
      doc.setTextColor(...colors.textMuted);
      doc.text(`Prepared for: ${user.name} (${user.email})`, margin, pageHeight - 7);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }

    // =========================================================================
    // PAGE 1 — FINANCIAL OVERVIEW
    // =========================================================================
    drawPageTemplate(1, 3, 'Page 1 — Financial Overview');

    let y = 30;

    // Report Title Block
    doc.setTextColor(...colors.textDark);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Financial Overview', margin, y);
    y += 6;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text(`Comprehensive financial snapshot and liquidity analysis for ${user.name}.`, margin, y);
    y += 10;

    // Calculate Key Metrics
    const totalIncome = summary.total_income || 0;
    const totalExpense = summary.total_expense || 0;
    const netSavings = summary.net_cash_savings || 0;
    const netWorth = summary.net_worth || 0;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
    const investmentsVal = summary.investments_current_value || 0;
    const goalsSaved = summary.total_saved_in_goals || 0;

    // 4 Key Summary Cards Grid
    const cardWidth = (contentWidth - 9) / 2;
    const cardHeight = 24;

    const cardsData = [
      { label: 'TOTAL NET WORTH', val: fmtMoney(netWorth, currency), sub: 'Savings + Investment Assets', color: colors.primary },
      { label: 'MONTHLY CASH FLOW', val: `${fmtMoney(totalIncome, currency)} / ${fmtMoney(totalExpense, currency)}`, sub: 'Income Inflows vs Expense Outflows', color: colors.green },
      { label: 'SAVINGS RATE', val: `${savingsRate}%`, sub: savingsRate >= 20 ? 'Optimal discipline (Target >20%)' : 'Needs attention (Target >20%)', color: savingsRate >= 20 ? colors.green : colors.amber },
      { label: 'INVESTMENTS & GOALS', val: fmtMoney(investmentsVal + goalsSaved, currency), sub: `Assets: ${fmtMoney(investmentsVal, currency)} | Goals: ${fmtMoney(goalsSaved, currency)}`, color: colors.slate },
    ];

    cardsData.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = margin + col * (cardWidth + 9);
      const cy = y + row * (cardHeight + 6);

      // Card Background & Border
      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(...colors.cardBorder);
      doc.roundedRect(cx, cy, cardWidth, cardHeight, 2, 2, 'FD');

      // Accent Left Bar
      doc.setFillColor(...c.color);
      doc.roundedRect(cx, cy, 3, cardHeight, 1.5, 1.5, 'F');

      // Text inside card
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textMuted);
      doc.text(c.label, cx + 7, cy + 6);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textDark);
      doc.text(c.val, cx + 7, cy + 14);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text(c.sub, cx + 7, cy + 20);
    });

    y += (cardHeight * 2) + 16;

    // Financial Highlights & Position Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Key Financial Position Highlights', margin, y);
    y += 6;

    const highlightsRows = [
      ['Metric / Account Layer', 'Current Balance / Status', 'Benchmark / Health Indicator'],
      ['Liquid Cash Inflow (Income)', fmtMoney(totalIncome, currency), 'Active Inflow Stream'],
      ['Total Cash Outflow (Expenses)', fmtMoney(totalExpense, currency), totalExpense <= totalIncome * 0.7 ? 'Controlled (<70% Inflow)' : 'High Spend (>70% Inflow)'],
      ['Retained Net Cash Savings', fmtMoney(netSavings, currency), netSavings > 0 ? 'Positive Surplus' : 'Deficit Alert'],
      ['Active Investment Holdings', fmtMoney(investmentsVal, currency), `${investmentsList.length} Holdings Tracked`],
      ['Sinking Goals Capital', fmtMoney(goalsSaved, currency), `${goalsList.length} Active Goals`],
      ['Daily Habit Discipline Index', `${summary.habits_completed_today}/${summary.habit_count} Completed Today`, `${summary.habit_count} Configured Habits`],
    ];

    if (doc.autoTable) {
      doc.autoTable({
        startY: y,
        head: [highlightsRows[0]],
        body: highlightsRows.slice(1),
        theme: 'striped',
        headStyles: { fillStyle: 'F', fillColor: colors.navy, textColor: colors.white, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5, textColor: colors.textDark },
        alternateRowStyles: { fillColor: colors.lightBg },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // Summary Narrative Box
    doc.setFillColor(239, 246, 255); // soft blue tint
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.primary);
    doc.text('📌 Executive Summary Insight', margin + 5, y + 6);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textDark);
    const summaryMsg = savingsRate >= 20
      ? `Strong financial performance. Your current savings rate of ${savingsRate}% exceeds the standard 20% benchmark. You have accumulated ${fmtMoney(netWorth, currency)} in overall net worth across liquid cash and investments.`
      : `Opportunity for optimization. Your current savings rate is ${savingsRate}%. Focus on trimming non-essential recurring expenses and maintaining daily habit streaks to boost monthly cash retention toward the 20%+ target.`;
    
    doc.text(doc.splitTextToSize(summaryMsg, contentWidth - 10), margin + 5, y + 12);

    // =========================================================================
    // PAGE 2 — DETAILED BREAKDOWN & CASH FLOW
    // =========================================================================
    doc.addPage();
    drawPageTemplate(2, 3, 'Page 2 — Detailed Breakdown');
    y = 30;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Expense Category Breakdown & Top Transactions', margin, y);
    y += 8;

    // Expense Category Table
    const catData = (summary.category_breakdown && summary.category_breakdown.length)
      ? summary.category_breakdown.map(c => [
          c.category,
          fmtMoney(c.total, currency),
          `${totalExpense > 0 ? Math.round((c.total / totalExpense) * 100) : 0}%`,
        ])
      : [['General', fmtMoney(totalExpense, currency), '100%']];

    if (doc.autoTable) {
      doc.autoTable({
        startY: y,
        head: [['Category', 'Total Amount Spent', 'Share of Total Expenses']],
        body: catData,
        theme: 'grid',
        headStyles: { fillColor: colors.slate, textColor: colors.white, fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: colors.textDark },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Top 10 Recent Transactions Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Recent Financial Transactions (Top 10)', margin, y);
    y += 6;

    const allTx = [
      ...incomeList.map(i => ({ date: i.date, desc: i.source, amount: i.amount, type: 'INCOME' })),
      ...expenseList.map(e => ({ date: e.date, desc: `${e.category} (${e.note || 'Expense'})`, amount: -e.amount, type: 'EXPENSE' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    const txRows = allTx.length ? allTx.map(t => [
      t.date,
      t.desc,
      t.type,
      fmtMoney(Math.abs(t.amount), currency),
    ]) : [['-', 'No transactions logged yet', '-', '-']];

    if (doc.autoTable) {
      doc.autoTable({
        startY: y,
        head: [['Date', 'Description / Category', 'Type', 'Amount']],
        body: txRows,
        theme: 'striped',
        headStyles: { fillColor: colors.navy, textColor: colors.white, fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: colors.textDark },
        columnStyles: { 3: { fontStyle: 'bold', halign: 'right' } },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // Goals & Habits Snapshot
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Savings Goals & Daily Habit Streaks', margin, y);
    y += 6;

    const goalsRows = goalsList.length
      ? goalsList.slice(0, 4).map(g => [g.title, fmtMoney(g.target_amount, currency), fmtMoney(g.saved_amount, currency), `${g.progress_percent || Math.round((g.saved_amount/g.target_amount)*100)}%`])
      : [['No active goals set', '-', '-', '-']];

    if (doc.autoTable) {
      doc.autoTable({
        startY: y,
        head: [['Goal Milestone', 'Target Amount', 'Saved So Far', 'Progress']],
        body: goalsRows,
        theme: 'grid',
        headStyles: { fillColor: colors.primary, textColor: colors.white, fontSize: 8.5, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8, textColor: colors.textDark },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Embed Active Chart Canvas Image if available
    const activeChartCanvas = document.getElementById('cashflow-chart') || document.getElementById('cf-chart');
    if (activeChartCanvas) {
      try {
        const chartImgData = activeChartCanvas.toDataURL('image/png', 1.0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Monthly Cash Flow Dynamics (Chart Snapshot)', margin, y);
        y += 4;
        doc.addImage(chartImgData, 'PNG', margin, y, contentWidth, 38);
      } catch (e) {
        console.warn('Could not export chart image to PDF:', e);
      }
    }

    // =========================================================================
    // PAGE 3 — AI INSIGHTS & RECOMMENDATIONS
    // =========================================================================
    doc.addPage();
    drawPageTemplate(3, 3, 'Page 3 — Insights & Recommendations');
    y = 30;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...colors.textDark);
    doc.text('Automated Insights & Financial Recommendations', margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text('Algorithmic analysis derived from your real-time cash flow and habit consistency.', margin, y);
    y += 12;

    // Rule-Based Insights Evaluation
    const insights = [];

    // 1. Spending Warning
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
          title: `⚠️ Spending Concentration Warning: ${highestCat}`,
          desc: `Your spending in "${highestCat}" represents ${pct}% of your total monthly outflow (${fmtMoney(highestCatTotal, currency)}). Consider establishing a weekly spending cap to avoid overruns.`,
          tag: 'SPENDING WARNING',
          color: colors.red,
        });
      }
    }

    // 2. Savings Rate Recommendation
    if (savingsRate >= 30) {
      insights.push({
        title: `⚡ Exceptional Savings Discipline (${savingsRate}%)`,
        desc: `You are saving ${savingsRate}% of your total earnings. Allocate surplus cash flow toward higher-yield investment assets (e.g. index funds or target SIPs) to accelerate net worth compounding.`,
        tag: 'WEALTH GROWTH',
        color: colors.green,
      });
    } else if (savingsRate >= 15) {
      insights.push({
        title: `📈 Good Cash Retention (${savingsRate}%)`,
        desc: `You are retaining ${savingsRate}% of income. To reach financial independence milestones faster, aim to reduce recurring discretionary expenses by 5-10% next month.`,
        tag: 'OPTIMIZATION',
        color: colors.primary,
      });
    } else {
      insights.push({
        title: `🚨 Low Savings Margin (${savingsRate}%)`,
        desc: `Your savings rate is below the 20% healthy threshold. Review variable expenses immediately and automate a fixed daily micro-saving habit.`,
        tag: 'ACTION REQUIRED',
        color: colors.red,
      });
    }

    // 3. Habit Improvement Suggestion
    const habitCount = summary.habit_count || 0;
    const habitsCompleted = summary.habits_completed_today || 0;
    if (habitCount === 0) {
      insights.push({
        title: `⚡ Habit System Inactive`,
        desc: `You haven't configured any financial habits. Creating simple daily habits (e.g., "Log all cash purchases", "Save ₹100 daily") is statistically proven to boost savings by 3.4x.`,
        tag: 'HABIT TIP',
        color: colors.amber,
      });
    } else {
      insights.push({
        title: `⚡ Habit Streak Progress (${habitsCompleted}/${habitCount} Done Today)`,
        desc: `Habit consistency drives automatic wealth building. Maintain your daily streaks without breaking the chain to form permanent money discipline.`,
        tag: 'HABIT STREAK',
        color: colors.green,
      });
    }

    // 4. Wealth Growth Projection Summary
    const projectedNetWorthIn1Year = Math.round(netWorth + (netSavings * 12));
    insights.push({
      title: `📊 12-Month Net Worth Projection`,
      desc: `At your current average monthly savings velocity of ${fmtMoney(netSavings, currency)}, your net worth is projected to reach approximately ${fmtMoney(projectedNetWorthIn1Year, currency)} over the next 12 months.`,
      tag: 'PROJECTION',
      color: colors.primary,
    });

    // Render Insights Cards
    insights.forEach((ins) => {
      doc.setFillColor(...colors.lightBg);
      doc.setDrawColor(...colors.cardBorder);
      doc.roundedRect(margin, y, contentWidth, 30, 2, 2, 'FD');

      // Left Color Accent
      doc.setFillColor(...ins.color);
      doc.roundedRect(margin, y, 3, 30, 1.5, 1.5, 'F');

      // Header Tag
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.textDark);
      doc.text(ins.title, margin + 7, y + 8);

      // Description
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textMuted);
      const splitDesc = doc.splitTextToSize(ins.desc, contentWidth - 14);
      doc.text(splitDesc, margin + 7, y + 15);

      y += 36;
    });

    // Disclaimer Box at Bottom of Page 3
    doc.setFillColor(254, 243, 199); // amber soft
    doc.setDrawColor(252, 211, 77);
    doc.roundedRect(margin, pageHeight - 45, contentWidth, 24, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('⚖️ Legal Financial Disclaimer', margin + 5, pageHeight - 38);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 53, 15);
    const disclaimerText = 'This report is generated automatically by Finora based on user-entered financial logs. It does not constitute certified investment advice, tax counseling, or formal financial planning. Always consult an accredited financial professional before executing major investment decisions.';
    doc.text(doc.splitTextToSize(disclaimerText, contentWidth - 10), margin + 5, pageHeight - 32);

    // Save PDF
    const filename = `Finora_Financial_Report_${user.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
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
