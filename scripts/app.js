/* app.js — W4 v0.1 Excel → Markdown UI controller */

(function () {
  'use strict';

  // ==================== Element refs ====================
  const $ = (id) => document.getElementById(id);
  const dropZone = $('drop-zone');
  const fileInput = $('file-input');
  const fileInfo = $('file-info');
  const sheetTabs = $('sheet-tabs');
  const previewBody = $('preview-body');
  const mdOutput = $('md-output');
  const btnCopy = $('btn-copy');
  const btnDownload = $('btn-download');
  const btnReset = $('btn-reset');
  const loading = $('loading');
  const errorMsg = $('error-msg');
  const headerRowSel = $('header-row-sel');
  const totalRowsHint = $('total-rows-hint');

  // ==================== State ====================
  const state = {
    parsed: null,          // { workbook, sheets }
    activeSheetIdx: 0,
    headerRow: 0,          // null = auto-detect
    lastMarkdown: '',
  };

  // ==================== Upload handling ====================
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, preventDefaults, false);
  });
  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.add('dragging'), false);
  });
  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, () => dropZone.classList.remove('dragging'), false);
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files[0]) handleFile(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  });

  // 點擊 drop-zone 觸發 file input
  dropZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
      fileInput.click();
    }
  });

  function handleFile(file) {
    hideError();
    showLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const parsed = Excel2Md.parseWorkbook(data);
        state.parsed = parsed;
        state.activeSheetIdx = 0;
        showFileInfo(file, parsed);
        renderSheetTabs();
        renderActiveSheet();
        showLoading(false);
      } catch (err) {
        console.error('[W4] Parse error:', err);
        showError('解析失敗: ' + err.message);
        showLoading(false);
      }
    };
    reader.onerror = () => {
      showError('讀取檔案失敗');
      showLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }

  function showFileInfo(file, parsed) {
    const sheetCount = parsed.sheets.length;
    const sizeKB = (file.size / 1024).toFixed(1);
    fileInfo.innerHTML = `
      <strong>${escapeHTML(file.name)}</strong>
      <span class="file-meta">${sizeKB} KB · ${sheetCount} 個 sheet</span>
    `;
    fileInfo.classList.remove('hidden');
  }

  // ==================== Sheet tabs ====================
  function renderSheetTabs() {
    const sheets = state.parsed.sheets;
    if (sheets.length <= 1) {
      sheetTabs.classList.add('hidden');
      return;
    }
    sheetTabs.classList.remove('hidden');
    sheetTabs.innerHTML = sheets
      .map((s, i) => `
        <button class="sheet-tab ${i === state.activeSheetIdx ? 'active' : ''}" data-idx="${i}">
          ${escapeHTML(s.name)}
        </button>
      `)
      .join('');
    sheetTabs.querySelectorAll('.sheet-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeSheetIdx = Number(btn.dataset.idx);
        renderSheetTabs();
        renderActiveSheet();
      });
    });
  }

  // ==================== Active sheet render ====================
  function renderActiveSheet() {
    if (!state.parsed) return;
    const sheet = state.parsed.sheets[state.activeSheetIdx];
    if (!sheet) return;

    const opts = {
      headerRow: state.headerRow === 'auto' ? null : state.headerRow,
      maxRows: 10000,
    };
    const { headers, rows, headerRow, totalRows } = Excel2Md.sheetToJson(sheet.json, opts);

    // 更新 header row 顯示
    headerRowSel.value = String(headerRow);

    // 提示 total rows
    if (totalRows > rows.length) {
      totalRowsHint.textContent = `預覽首 ${rows.length} / 共 ${totalRows} 行 (memory safety)`;
      totalRowsHint.classList.remove('hidden');
    } else {
      totalRowsHint.textContent = `共 ${totalRows} 行`;
      totalRowsHint.classList.remove('hidden');
    }

    // Markdown
    const md = Excel2Md.rowsToMarkdown(headers, rows);
    state.lastMarkdown = md;

    // Preview HTML table
    const tableHTML = buildPreviewHTML(headers, rows);
    previewBody.innerHTML = tableHTML;

    // Markdown code view
    mdOutput.value = md;
  }

  function buildPreviewHTML(headers, rows) {
    if (!headers.length) {
      return '<p class="empty-hint">空 sheet</p>';
    }
    let html = '<table class="preview-table"><thead><tr>';
    for (const h of headers) {
      html += `<th>${escapeHTML(h || '(空)')}</th>`;
    }
    html += '</tr></thead><tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (let i = 0; i < headers.length; i++) {
        const cell = row[i] !== null && row[i] !== undefined ? String(row[i]) : '';
        html += `<td>${escapeHTML(cell)}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  // ==================== Header row control ====================
  headerRowSel.addEventListener('change', () => {
    const v = headerRowSel.value;
    if (v === 'auto') {
      state.headerRow = 'auto';
    } else {
      state.headerRow = Number(v);
    }
    renderActiveSheet();
  });

  // ==================== Copy / Download ====================
  btnCopy.addEventListener('click', async () => {
    if (!state.lastMarkdown) {
      showError('未有 markdown 可複製');
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(state.lastMarkdown);
      } else {
        // Fallback
        mdOutput.select();
        document.execCommand('copy');
      }
      toast('已複製到剪貼簿');
    } catch (err) {
      showError('複製失敗: ' + err.message);
    }
  });

  btnDownload.addEventListener('click', () => {
    if (!state.lastMarkdown) {
      showError('未有 markdown 可下載');
      return;
    }
    const sheetName = state.parsed.sheets[state.activeSheetIdx].name;
    const safeName = sheetName.replace(/[^\w\u4e00-\u9fa5-]/g, '_');
    const blob = new Blob([state.lastMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // ==================== Reset ====================
  btnReset.addEventListener('click', () => {
    state.parsed = null;
    state.activeSheetIdx = 0;
    state.lastMarkdown = '';
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    sheetTabs.classList.add('hidden');
    previewBody.innerHTML = '<p class="empty-hint">請上傳 .xlsx / .xls / .csv 檔案</p>';
    mdOutput.value = '';
    totalRowsHint.classList.add('hidden');
    hideError();
  });

  // ==================== UI helpers ====================
  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showLoading(on) {
    if (on) loading.classList.remove('hidden');
    else loading.classList.add('hidden');
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
  }

  function hideError() {
    errorMsg.classList.add('hidden');
  }

  function toast(msg) {
    // Simple inline toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }
})();
