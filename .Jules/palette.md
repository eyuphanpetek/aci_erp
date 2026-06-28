## 2026-06-28 - App Academy Button Accessibility
**Learning:** Found multiple icon-only buttons in the App Academy dashboard and course pages that lack ARIA labels. This appears to be a systemic issue in template-based code where structural elements (like next/chevron navigation buttons or generic search buttons) are reused without specific a11y labels.
**Action:** Always scan for generic `btn-icon` instances in reused UI components and ensure they have appropriate context-specific ARIA labels, especially on dashboard lists and search inputs.
