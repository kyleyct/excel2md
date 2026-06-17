/**
 * parser.js — Excel / CSV → Markdown 純 function 模組
 *
 * v0.1 設計:
 *  - 純 function, 唔耦合 DOM
 *  - 將來 W7 (LLM 幻覺修正器) reuse: 加 validation layer
 *  - SheetJS 載入 window.XLSX 後即可用
 *
 * API:
 *   Excel2Md.parseWorkbook(arrayBuffer) -> Workbook
 *   Excel2Md.workbookToMarkdown(workbook, options) -> { name, markdown }
 *   Excel2Md.sheetToJson(worksheet, options) -> { headers, rows }
 *   Excel2Md.rowsToMarkdown(headers, rows, options) -> string
 *   Excel2Md.detectHeaderRow(rows) -> number
 *   Excel2Md.escapeCell(s) -> string
 *   Excel2Md.escapeHeader(s) -> string  (header 比 cell 嚴格, 因為含 `|` 容易斷)
 *
 * 將來 W7 集成:
 *   - rowsToMarkdown 加 column-validate option
 *   - parseWorkbook 加 anomaly-detection (e.g. column type mismatch)
 *   - 寫獨立 validator.js 喺 parser 之上
 */

(function (global) {
  'use strict';

  // 預設值
  const DEFAULT_OPTIONS = {
    headerRow: null,            // null = auto-detect, 數字 = 指定 row index
    emptyPlaceholder: '',      // 空 cell 顯示咩
    trim: true,                 // cell 自動 trim
    maxRows: 10000,             // safety: 避免 memory 爆
  };

  // Markdown 特殊字符 escape
  function escapeCell(s) {
    if (s === null || s === undefined) return '';
    const str = String(s);
    // escape 字符: | (markdown table column separator)
    return str.replace(/\|/g, '\\|')
              .replace(/\n/g, ' ')      // 換行換做 space
              .replace(/\r/g, '');
  }

  function escapeHeader(s) {
    if (s === null || s === undefined) return '';
    const str = String(s);
    // Header 比 cell 嚴格: |, 換行, 多餘空白 全部處理
    return str.replace(/\|/g, '\\|')
              .replace(/\n/g, ' ')
              .replace(/\r/g, '')
              .trim();
  }

  /**
   * Auto-detect header row
   * 啟發: 第一行 non-empty row
   * 進一步啟發: 該行 average non-empty cells > 50% AND cells 唔似 data (e.g. 全係數字)
   */
  function detectHeaderRow(rows, maxCheck = 5) {
    if (!rows || !rows.length) return 0;
    const checkLimit = Math.min(rows.length, maxCheck);
    for (let i = 0; i < checkLimit; i++) {
      const row = rows[i] || [];
      if (!row.length) continue;
      const nonEmpty = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
      if (nonEmpty.length === 0) continue;
      // 第一個 non-empty row 就算 header
      return i;
    }
    return 0;
  }

  /**
   * 解析 workbook 從 array buffer
   * @param {ArrayBuffer} data
   * @returns {{workbook: object, sheets: [{name, json, headers, rows}]}}
   */
  function parseWorkbook(data) {
    if (!global.XLSX) {
      throw new Error('XLSX library not loaded. Include xlsx.full.min.js before parser.js');
    }
    const workbook = global.XLSX.read(data, { type: 'array', cellDates: true });
    const sheets = workbook.SheetNames.map(name => {
      const worksheet = workbook.Sheets[name];
      const json = global.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });
      return { name, json, worksheet };
    });
    return { workbook, sheets };
  }

  /**
   * 將 sheet 嘅 json 轉做 { headers, rows } 結構
   * - 自動偵測 header row
   * - 過濾空 row
   * - 限制 max rows (防 memory 爆)
   */
  function sheetToJson(worksheet, options = {}) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    let json;
    if (worksheet) {
      // 從 worksheet 直接
      json = global.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });
    } else if (Array.isArray(worksheet)) {
      json = worksheet;
    } else {
      throw new Error('sheetToJson expects worksheet or array');
    }

    if (!json || !json.length) {
      return { headers: [], rows: [], headerRow: 0 };
    }

    const headerIdx = opts.headerRow !== null ? opts.headerRow : detectHeaderRow(json);
    const headers = (json[headerIdx] || []).map(escapeHeader);
    const dataRows = json.slice(headerIdx + 1).filter(row => {
      // 過濾完全空白嘅 row
      return row.some(c => c !== null && c !== undefined && String(c).trim() !== '');
    });

    // 限制 max rows
    const limitedRows = dataRows.slice(0, opts.maxRows);
    return {
      headers,
      rows: limitedRows.map(row => (row || []).map(c => opts.trim && c ? String(c).trim() : c)),
      headerRow: headerIdx,
      totalRows: dataRows.length,
    };
  }

  /**
   * 將 headers + rows 轉做 markdown table
   * @returns {string} markdown 表格 (含 header + alignment)
   */
  function rowsToMarkdown(headers, rows, options = {}) {
    const opts = Object.assign({ emptyPlaceholder: '' }, options);
    if (!headers || !headers.length) return '';

    // 計算每列寬度 (用於 alignment)
    const colWidths = headers.map((h, ci) => {
      let max = h.length;
      for (const row of rows) {
        const cell = row[ci] !== null && row[ci] !== undefined ? String(row[ci]) : '';
        if (cell.length > max) max = cell.length;
      }
      return Math.min(max, 50); // cap 50 chars for readability
    });

    const lines = [];

    // Header row
    const headerLine = '| ' + headers.map((h, i) => padCell(h, colWidths[i])).join(' | ') + ' |';
    lines.push(headerLine);

    // Alignment row (default left-aligned)
    const alignLine = '| ' + colWidths.map(w => '-'.repeat(Math.max(3, w))).join(' | ') + ' |';
    lines.push(alignLine);

    // Data rows
    for (const row of rows) {
      const cells = colWidths.map((w, i) => {
        const raw = row[i];
        let cell;
        if (raw === null || raw === undefined || String(raw).trim() === '') {
          cell = opts.emptyPlaceholder;
        } else {
          cell = escapeCell(opts.trim ? String(raw).trim() : raw);
        }
        return padCell(cell, w);
      });
      lines.push('| ' + cells.join(' | ') + ' |');
    }

    return lines.join('\n');
  }

  function padCell(s, width) {
    const str = String(s);
    if (str.length >= width) return str;
    return str + ' '.repeat(width - str.length);
  }

  /**
   * 將整個 workbook 轉成 markdown (多 sheet → 各自 section)
   */
  function workbookToMarkdown(parsed, options = {}) {
    const sheets = parsed.sheets || [];
    const sections = [];
    for (const sheet of sheets) {
      const { headers, rows, totalRows } = sheetToJson(sheet.json, options);
      if (!headers.length) continue;
      const md = rowsToMarkdown(headers, rows, options);
      const sectionTitle = `# ${sheet.name}`;
      const note = totalRows > rows.length
        ? `\n\n_註: 共 ${totalRows} 行, 預覽首 ${rows.length} 行_\n`
        : '';
      sections.push(`${sectionTitle}\n\n${md}${note}`);
    }
    if (!sections.length) {
      return '_空 workbook (冇 sheet 或全部 sheet 空)_';
    }
    return sections.join('\n\n---\n\n');
  }

  // 暴露 API
  global.Excel2Md = {
    parseWorkbook,
    workbookToMarkdown,
    sheetToJson,
    rowsToMarkdown,
    detectHeaderRow,
    escapeCell,
    escapeHeader,
  };
})(typeof window !== 'undefined' ? window : this);
