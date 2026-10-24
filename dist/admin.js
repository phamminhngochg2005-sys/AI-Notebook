/* Sổ tay AI — Quản trị cấu hình trình bày, thông qua RESEARCH_CONFIG. */
(function () {
  'use strict';

  const FIELDS = [
    { key: 'productTitle', label: 'Tên sản phẩm đầy đủ', max: 500, rows: 3, required: true, placeholder: 'Sổ tay điện tử hướng dẫn sử dụng AI hỗ trợ giáo viên Tiểu học xây dựng kế hoạch bài dạy', help: 'Hiển thị trên bìa sổ tay và những vị trí giới thiệu sản phẩm.' },
    { key: 'researchTitle', label: 'Tên đề tài nghiên cứu', max: 500, rows: 3, placeholder: 'Nhập tên đề tài theo hồ sơ nghiên cứu', help: 'Có thể bổ sung khi tên đề tài chính thức được xác nhận.' },
    { key: 'groupName', label: 'Nhóm nghiên cứu', max: 250, placeholder: 'Tên nhóm hoặc thành viên thực hiện' },
    { key: 'organization', label: 'Đơn vị thực hiện', max: 250, placeholder: 'Tên trường, cơ quan hoặc đơn vị' },
    { key: 'applicationArea', label: 'Trường / địa bàn ứng dụng', max: 250, placeholder: 'Trường, xã hoặc địa bàn dự kiến triển khai' },
    { key: 'introduction', label: 'Giới thiệu đề tài', max: 3000, rows: 6, placeholder: 'Giới thiệu vấn đề, mục tiêu và định hướng của đề tài', help: 'Nêu những thông tin đã có căn cứ; có thể xuống dòng để chia đoạn.' },
    { key: 'applicationDescription', label: 'Mô tả phạm vi ứng dụng', max: 3000, rows: 5, placeholder: 'Đối tượng sử dụng, điều kiện triển khai và phạm vi ứng dụng dự kiến' }
  ];
  const mountedForms = new WeakSet();
  const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const icon = name => `<svg class="ra-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${{
    settings: '<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    save: '<path d="M4 3h13l4 4v14H3V3h1Zm3 0v6h10V3M7 21v-8h10v8"/>',
    reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
    book: '<path d="M12 6C8 4 5 4 2 5v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-3-1-6-1-10 1Zm0 0v15M5 9h4m6 0h4M5 13h4m6 0h4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M20 12H4m6-6-6 6 6 6"/>'
  }[name] || ''}</svg>`;

  function api() {
    const config = window.RESEARCH_CONFIG;
    if (!config || typeof config.get !== 'function' || typeof config.save !== 'function' || typeof config.reset !== 'function') {
      throw new Error('Research configuration is unavailable.');
    }
    return config;
  }

  function sanitize(value, max) {
    return String(value ?? '')
      .normalize('NFC')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
      .slice(0, max);
  }

  function configuration() {
    const config = api();
    const current = config.get() || {};
    const defaults = config.defaults || {};
    return Object.fromEntries(FIELDS.map(field => [field.key, sanitize(current[field.key] ?? defaults[field.key], field.max)]));
  }

  function fieldHTML(field, value) {
    const id = 'research-admin-' + field.key;
    const shared = `id="${id}" name="${field.key}" maxlength="${field.max}" aria-describedby="${id}-help ${id}-count" ${field.required ? 'required' : ''} placeholder="${escape(field.placeholder)}"`;
    return `<div class="ra-field ${field.rows ? 'ra-field-wide' : ''}">
      <label for="${id}">${escape(field.label)}${field.required ? '<span class="ra-required">*</span>' : ''}</label>
      ${field.rows ? `<textarea ${shared} rows="${field.rows}">${escape(value)}</textarea>` : `<input type="text" ${shared} value="${escape(value)}">`}
      <div class="ra-field-footer"><small id="${id}-help">${escape(field.help || 'Để trống nếu thông tin chưa được xác nhận.')}</small><span id="${id}-count" data-admin-counter="${field.key}">${value.length} / ${field.max}</span></div>
    </div>`;
  }

  function previewText(key, value) {
    return `<span data-admin-preview="${key}">${escape(value || 'Đang cập nhật')}</span>`;
  }

  function render() {
    let values;
    try {
      values = configuration();
    } catch (_) {
      return `<section class="research-admin"><div class="ra-unavailable" role="status">${icon('info')}<div><h1>Chưa mở được phần quản trị</h1><p>Cấu hình sổ tay chưa sẵn sàng. Vui lòng tải lại trang.</p><a class="button secondary" href="#home">Về bìa sổ tay</a></div></div></section>`;
    }

    return `<section class="research-admin" aria-labelledby="research-admin-heading">
      <header class="ra-heading"><div><a class="ra-back" href="#home">${icon('arrow')} Bìa sổ tay</a><span class="ra-eyebrow">QUẢN TRỊ NỘI DUNG</span><h1 id="research-admin-heading">Thông tin đề tài</h1><p>Cập nhật tên sổ tay và thông tin giới thiệu theo hồ sơ của thầy cô.</p></div><span class="ra-heading-mark">${icon('settings')}</span></header>
      <div class="ra-demo-notice">${icon('info')}<div><strong>Bản quản trị demo — thông tin chỉ lưu trên trình duyệt hiện tại</strong><p>Chọn “Lưu thay đổi” để áp dụng thông tin cho sổ tay trên trình duyệt này.</p></div></div>
      <div class="ra-layout">
        <form class="ra-form" id="research-admin-form">
          <div class="ra-panel-heading"><span class="ra-step">01</span><div><h2>Chỉnh sửa thông tin</h2><p>Thông tin chưa xác nhận có thể để trống.</p></div></div>
          <fieldset class="ra-fieldset"><legend>Tên sản phẩm và đề tài</legend><div class="ra-fields">${FIELDS.slice(0, 2).map(field => fieldHTML(field, values[field.key])).join('')}</div></fieldset>
          <fieldset class="ra-fieldset"><legend>Đơn vị và phạm vi thực hiện</legend><div class="ra-fields">${FIELDS.slice(2, 5).map(field => fieldHTML(field, values[field.key])).join('')}</div></fieldset>
          <fieldset class="ra-fieldset"><legend>Nội dung giới thiệu</legend><div class="ra-fields">${FIELDS.slice(5).map(field => fieldHTML(field, values[field.key])).join('')}</div></fieldset>
          <div class="ra-actions"><button class="button primary" type="submit" data-admin-save>${icon('save')} Lưu thay đổi</button><button class="button secondary" type="button" data-admin-reset>${icon('reset')} Khôi phục mẫu</button></div>
          <p class="ra-status" id="research-admin-status" role="status" aria-live="polite" aria-atomic="true">Thông tin hiện tại đã sẵn sàng để chỉnh sửa.</p>
        </form>
        <aside class="ra-preview" aria-labelledby="research-admin-preview-heading">
          <div class="ra-preview-heading"><div><span class="ra-eyebrow">XEM TRƯỚC THÔNG TIN</span><h2 id="research-admin-preview-heading">Bìa và phần giới thiệu</h2></div><span class="ra-preview-state" data-admin-preview-state>Đang hiển thị</span></div>
          <div class="ra-preview-cover"><div class="ra-cover-grid"></div><span class="ra-book-symbol">${icon('book')}<span>AI</span></span><span class="ra-cover-kicker">SỔ TAY ĐIỆN TỬ</span><h3 data-admin-preview="productTitle">${escape(values.productTitle || 'Đang cập nhật')}</h3><span class="ra-cover-caption">AI hỗ trợ. Giáo viên làm chủ.</span><span class="ra-cover-orbit" aria-hidden="true"></span></div>
          <div class="ra-preview-body"><dl class="ra-preview-facts"><div><dt>Nhóm nghiên cứu</dt><dd>${previewText('groupName', values.groupName)}</dd></div><div><dt>Đơn vị thực hiện</dt><dd>${previewText('organization', values.organization)}</dd></div><div><dt>Trường / địa bàn ứng dụng</dt><dd>${previewText('applicationArea', values.applicationArea)}</dd></div></dl><section class="ra-preview-section"><h3>Tên đề tài nghiên cứu</h3><p data-admin-preview="researchTitle">${escape(values.researchTitle || 'Đang cập nhật')}</p></section><section class="ra-preview-section"><h3>Giới thiệu đề tài</h3><p data-admin-preview="introduction">${escape(values.introduction || 'Đang cập nhật')}</p></section><section class="ra-preview-section"><h3>Phạm vi ứng dụng</h3><p data-admin-preview="applicationDescription">${escape(values.applicationDescription || 'Đang cập nhật')}</p></section></div>
          <p class="ra-preview-caption">${icon('eye')} Bản xem trước cập nhật khi thầy cô nhập; thông tin chỉ được áp dụng sau khi lưu.</p>
        </aside>
      </div>
    </section>`;
  }

  function collect(form) {
    return Object.fromEntries(FIELDS.map(field => [field.key, sanitize(form.elements.namedItem(field.key).value, field.max)]));
  }

  function updateCounters(form) {
    FIELDS.forEach(field => {
      const counter = form.querySelector(`[data-admin-counter="${field.key}"]`);
      if (counter) counter.textContent = form.elements.namedItem(field.key).value.length + ' / ' + field.max;
    });
  }

  function preview(form, values, dirty) {
    const root = form.closest('.research-admin');
    if (!root) return;
    root.querySelectorAll('[data-admin-preview]').forEach(element => {
      element.textContent = values[element.dataset.adminPreview] || 'Đang cập nhật';
    });
    const badge = root.querySelector('[data-admin-preview-state]');
    if (badge) {
      badge.textContent = dirty ? 'Chưa lưu thay đổi' : 'Đã lưu';
      badge.classList.toggle('is-dirty', dirty);
    }
  }

  function status(form, message, kind) {
    const element = form.querySelector('#research-admin-status');
    if (!element) return;
    element.textContent = message;
    element.className = 'ra-status' + (kind ? ' is-' + kind : '');
  }

  function busy(form, value) {
    form.querySelectorAll('[data-admin-save], [data-admin-reset]').forEach(button => { button.disabled = value; });
  }

  function activeForm(fallback) {
    return document.getElementById('research-admin-form') || fallback;
  }

  function apply(form, values) {
    FIELDS.forEach(field => { form.elements.namedItem(field.key).value = values[field.key]; });
    updateCounters(form);
    preview(form, values, false);
  }

  function mount() {
    const form = document.getElementById('research-admin-form');
    if (!form || mountedForms.has(form)) return;
    mountedForms.add(form);
    let savedValues = configuration();

    form.addEventListener('input', event => {
      if (!FIELDS.some(field => field.key === event.target.name)) return;
      event.target.setCustomValidity('');
      updateCounters(form);
      const values = collect(form);
      const dirty = FIELDS.some(field => values[field.key] !== savedValues[field.key]);
      preview(form, values, dirty);
      status(form, dirty ? 'Có thay đổi chưa lưu. Chọn “Lưu thay đổi” để áp dụng.' : 'Thông tin đang khớp với bản đã lưu.', dirty ? 'dirty' : '');
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const values = collect(form);
      const title = form.elements.namedItem('productTitle');
      if (!values.productTitle) {
        title.setCustomValidity('Vui lòng nhập tên sản phẩm.');
        title.reportValidity();
        return;
      }
      if (!form.reportValidity()) return;
      busy(form, true);
      try {
        await api().save(values);
        savedValues = configuration();
        const currentForm = activeForm(form);
        apply(currentForm, savedValues);
        status(currentForm, 'Đã lưu thay đổi trên trình duyệt này. Thông tin của sổ tay đã được cập nhật.', 'success');
      } catch (_) {
        status(activeForm(form), 'Chưa lưu được thay đổi. Thông tin đang nhập vẫn được giữ để thầy cô thử lại.', 'error');
      } finally {
        busy(form, false);
      }
    });

    form.addEventListener('click', async event => {
      if (!event.target.closest('[data-admin-reset]')) return;
      busy(form, true);
      try {
        await api().reset();
        savedValues = configuration();
        const currentForm = activeForm(form);
        apply(currentForm, savedValues);
        currentForm.elements.namedItem('productTitle').setCustomValidity('');
        status(currentForm, 'Đã khôi phục thông tin mẫu trên trình duyệt này.', 'success');
      } catch (_) {
        status(activeForm(form), 'Chưa khôi phục được thông tin mẫu. Vui lòng thử lại.', 'error');
      } finally {
        busy(form, false);
      }
    });
  }

  window.SOTAY_ADMIN = { render, mount };
})();
