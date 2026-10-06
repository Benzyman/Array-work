/**
 * Progressive form handling for any <form data-form>.
 * - Inline validation on blur, re-validation on input once a field has been touched
 * - Loading, success and error states
 * - Posts JSON to `data-endpoint` when configured, otherwise composes an email
 *   in the visitor's mail client addressed to `data-mailto`.
 */

const messages: Record<string, (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => string> = {
  valueMissing: (el) =>
    el.type === 'checkbox'
      ? 'Please confirm to continue.'
      : `Please ${el instanceof HTMLSelectElement ? 'select' : 'enter'} ${el.dataset.label ?? 'this field'}.`,
  typeMismatch: (el) => (el.type === 'email' ? 'Enter a valid email address, like name@company.com.' : 'Please check this value.'),
  tooShort: (el) => `Please add a little more detail (at least ${'minLength' in el ? el.minLength : 0} characters).`,
  patternMismatch: () => 'Please check the format of this value.',
};

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function validate(field: Field): boolean {
  const wrap = field.closest<HTMLElement>('.field, .checkbox-field');
  const errorEl = wrap?.querySelector<HTMLElement>('[data-error]');
  field.setCustomValidity('');
  const v = field.validity;
  let message = '';
  if (!v.valid) {
    const key = (Object.keys(messages) as (keyof ValidityState)[]).find((k) => v[k]);
    message = key ? messages[key](field) : field.validationMessage;
  }
  const invalid = Boolean(message);
  wrap?.setAttribute('data-invalid', String(invalid));
  field.setAttribute('aria-invalid', String(invalid));
  if (errorEl) errorEl.querySelector('span')!.textContent = message;
  return !invalid;
}

function initForm(form: HTMLFormElement) {
  const fields = [...form.querySelectorAll<Field>('input, textarea, select')].filter((f) => f.name && f.type !== 'hidden');
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
  const success = document.getElementById(form.dataset.success ?? '');
  const errorBox = form.querySelector<HTMLElement>('[data-form-error]');
  const summary = form.querySelector<HTMLElement>('[data-summary]');
  const endpoint = form.dataset.endpoint?.trim();
  const mailto = form.dataset.mailto ?? '';

  form.noValidate = true;

  for (const f of fields) {
    f.addEventListener('blur', () => {
      if (f.value || f.dataset.touched) {
        f.dataset.touched = 'true';
        validate(f);
      }
    });
    f.addEventListener('input', () => f.dataset.touched && validate(f));
    f.addEventListener('change', () => f.dataset.touched && validate(f));
  }

  // Character counter
  form.querySelectorAll<HTMLTextAreaElement>('textarea[maxlength]').forEach((ta) => {
    const counter = form.querySelector<HTMLElement>(`[data-counter="${ta.name}"]`);
    const update = () => counter && (counter.textContent = `${ta.value.length} / ${ta.maxLength}`);
    ta.addEventListener('input', update);
    update();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBox) errorBox.hidden = true;

    const results = fields.map((f) => {
      f.dataset.touched = 'true';
      return validate(f);
    });
    const firstInvalid = fields[results.indexOf(false)];
    if (firstInvalid) {
      const n = results.filter((r) => !r).length;
      if (summary) {
        summary.hidden = false;
        summary.querySelector('span')!.textContent = `Please fix ${n} ${n === 1 ? 'field' : 'fields'} before sending.`;
      }
      firstInvalid.focus();
      return;
    }
    if (summary) summary.hidden = true;

    const data = Object.fromEntries(new FormData(form).entries());
    // Honeypot: silently drop bot submissions
    if (data.company_website) return;
    delete data.company_website;

    submit?.setAttribute('data-loading', 'true');
    submit?.setAttribute('aria-busy', 'true');

    try {
      if (endpoint) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      } else {
        const subject = form.dataset.subject ?? 'Website enquiry';
        const body = Object.entries(data)
          .filter(([k, v]) => v && k !== 'consent')
          .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}: ${v}`)
          .join('\n');
        await new Promise((r) => setTimeout(r, 450));
        window.location.href = `mailto:${mailto}?subject=${encodeURIComponent(`${subject} — ${data.name ?? ''}`)}&body=${encodeURIComponent(body)}`;
      }
      form.hidden = true;
      if (success) {
        success.hidden = false;
        success.querySelectorAll<HTMLElement>('[data-mode="endpoint"]').forEach((el) => (el.hidden = !endpoint));
        success.querySelectorAll<HTMLElement>('[data-mode="mailto"]').forEach((el) => (el.hidden = Boolean(endpoint)));
        success.focus();
      }
    } catch {
      if (errorBox) {
        errorBox.hidden = false;
        errorBox.focus();
      }
    } finally {
      submit?.removeAttribute('data-loading');
      submit?.removeAttribute('aria-busy');
    }
  });

  // "Send another" resets to a clean form
  success?.querySelector('[data-reset-form]')?.addEventListener('click', () => {
    form.reset();
    fields.forEach((f) => {
      delete f.dataset.touched;
      f.removeAttribute('aria-invalid');
      f.closest('.field, .checkbox-field')?.setAttribute('data-invalid', 'false');
    });
    success.hidden = true;
    form.hidden = false;
    fields[0]?.focus();
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach(initForm);
