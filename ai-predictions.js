/**
 * ai-predictions.js - AI-Powered Stock Intelligence & NLP Search
 * Predictive stock alerts, smart NLP search with fuzzy matching
 */

const AIPredictions = (() => {
  const HISTORY_KEY = 'stock_sphere_history';

  // ---- Stock History Tracking ----
  function recordSnapshot(inventory) {
    const history = getHistory();
    const today = new Date().toISOString().split('T')[0];
    if (!history[today]) history[today] = {};
    inventory.forEach(item => {
      history[today][item.id] = item.quantity;
    });
    // Keep only last 30 days
    const dates = Object.keys(history).sort();
    if (dates.length > 30) delete history[dates[0]];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function getHistory() {
    const h = localStorage.getItem(HISTORY_KEY);
    return h ? JSON.parse(h) : {};
  }

  // ---- Prediction Engine ----
  function predictStockout(item) {
    const history = getHistory();
    const dates = Object.keys(history).sort();
    if (dates.length < 2) return null;

    // Collect quantity data points for this item
    const points = dates.map(d => ({ date: d, qty: history[d][item.id] })).filter(p => p.qty !== undefined);
    if (points.length < 2) return null;

    // Calculate average daily depletion rate
    let totalChange = 0;
    let dataPoints = 0;
    for (let i = 1; i < points.length; i++) {
      const delta = points[i - 1].qty - points[i].qty;
      if (delta >= 0) { totalChange += delta; dataPoints++; }
    }
    if (dataPoints === 0) return null;
    const dailyRate = totalChange / dataPoints;
    if (dailyRate <= 0) return null;

    const daysUntilStockout = Math.floor(item.quantity / dailyRate);
    const confidence = dataPoints >= 7 ? 'High' : dataPoints >= 3 ? 'Medium' : 'Low';
    const stockoutDate = new Date(Date.now() + daysUntilStockout * 86400000).toLocaleDateString('en-IN');

    return { daysUntilStockout, dailyRate: dailyRate.toFixed(2), confidence, stockoutDate };
  }

  function getAlerts(inventory) {
    const alerts = [];
    inventory.forEach(item => {
      if (item.quantity === 0) {
        alerts.push({ item, type: 'out_of_stock', message: `${item.name} is OUT OF STOCK!`, urgency: 'critical' });
        return;
      }
      const prediction = predictStockout(item);
      if (prediction && prediction.daysUntilStockout <= 7) {
        alerts.push({ item, type: 'predicted_stockout', prediction,
          message: `${item.name} may run out in ~${prediction.daysUntilStockout} days`, urgency: 'high' });
      } else if (item.quantity < 20) {
        alerts.push({ item, type: 'low_stock', message: `${item.name} is running low (${item.quantity} ${item.unit || 'units'})`, urgency: 'medium' });
      }
    });
    return alerts.sort((a, b) => { const o = { critical: 0, high: 1, medium: 2 }; return o[a.urgency] - o[b.urgency]; });
  }

  // ---- NLP Search Engine ----
  // Levenshtein distance for fuzzy matching
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j-1], dp[i-1][j], dp[i][j-1]);
      }
    }
    return dp[m][n];
  }

  function fuzzyMatch(query, text, threshold = 2) {
    query = query.toLowerCase(); text = text.toLowerCase();
    if (text.includes(query)) return true;
    const words = text.split(' ');
    return words.some(w => levenshtein(query, w) <= threshold && query.length > 3);
  }

  function parseNLPQuery(query, db) {
    let results = [...db.inventory];
    const q = query.toLowerCase().trim();

    // "low stock [category]" pattern
    const lowStockMatch = q.match(/low\s*stock(?:\s+(\w+))?/);
    if (lowStockMatch) {
      results = results.filter(i => i.quantity < 20);
      if (lowStockMatch[1]) results = results.filter(i => fuzzyMatch(lowStockMatch[1], i.category));
      return { results, hint: `Showing low stock items${lowStockMatch[1] ? ' in ' + lowStockMatch[1] : ''}` };
    }

    // "show [category] under [price]" or "[category] under [price]"
    const priceMatch = q.match(/(?:show\s+me\s+)?(\w+)\s+under\s+[\u20b9$]?([\d,]+)/);
    if (priceMatch) {
      const cat = priceMatch[1], maxPrice = parseFloat(priceMatch[2].replace(',', ''));
      results = results.filter(i => fuzzyMatch(cat, i.category) && i.price <= maxPrice);
      return { results, hint: `Showing ${priceMatch[1]} items under ₹${maxPrice}` };
    }

    // "out of stock" pattern
    if (q.includes('out of stock') || q === 'oos') {
      results = results.filter(i => i.quantity === 0);
      return { results, hint: 'Showing out of stock items' };
    }

    // "items added this week" pattern
    if (q.includes('this week') || q.includes('recent')) {
      const weekAgo = Date.now() - 7 * 86400000;
      results = results.filter(i => i.id > weekAgo / 1000 || (i.addedAt && i.addedAt > weekAgo));
      return { results, hint: 'Showing recently added items' };
    }

    // "supplier" patterns
    const supplierMatch = q.match(/supplier[s]?\s+(?:from\s+|in\s+)?(\w+)/);
    if (supplierMatch) {
      results = results.filter(i => fuzzyMatch(supplierMatch[1], i.supplier));
      return { results, hint: `Filtering by supplier: ${supplierMatch[1]}` };
    }

    // Fallback: fuzzy keyword search across all fields
    const keywords = q.split(/\s+/).filter(k => k.length > 2);
    if (keywords.length > 0) {
      results = results.filter(item =>
        keywords.some(k =>
          fuzzyMatch(k, item.name) ||
          fuzzyMatch(k, item.category) ||
          fuzzyMatch(k, item.sku) ||
          fuzzyMatch(k, item.supplier)
        )
      );
    }
    return { results, hint: results.length > 0 ? `Found ${results.length} matching items` : 'No items found' };
  }

  function renderAlertsBanner(inventory) {
    const alerts = getAlerts(inventory);
    if (alerts.length === 0) return;
    const banner = document.getElementById('ai-alerts-banner');
    if (!banner) return;
    banner.innerHTML = `
      <div class="ai-alerts-header">
        <i class="fas fa-robot"></i> AI Stock Alerts (${alerts.length})
        <button onclick="this.closest('.ai-alerts-banner-wrap').style.display='none'" class="ai-alerts-close">&times;</button>
      </div>
      <div class="ai-alerts-list">
        ${alerts.slice(0, 3).map(a => `
          <div class="ai-alert ai-alert-${a.urgency}">
            <i class="fas ${a.urgency === 'critical' ? 'fa-skull-crossbones' : a.urgency === 'high' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
            <span>${a.message}</span>
            ${a.prediction ? `<small class="ai-confidence">Confidence: ${a.prediction.confidence} | Rate: ${a.prediction.dailyRate}/day</small>` : ''}
          </div>
        `).join('')}
        ${alerts.length > 3 ? `<p class="ai-more">+${alerts.length - 3} more alerts. Check Reports for full view.</p>` : ''}
      </div>
    `;
    banner.closest('.ai-alerts-banner-wrap').style.display = 'block';
  }

  return { recordSnapshot, getAlerts, parseNLPQuery, renderAlertsBanner };
})();
