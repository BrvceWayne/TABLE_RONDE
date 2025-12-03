import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { text: String }

  copy() {
    navigator.clipboard.writeText(this.textValue).then(() => {
      const textEl = this.element.querySelector('.dashboard__copy-text')
      const iconEl = this.element.querySelector('.dashboard__copy-icon')

      if (textEl) {
        const originalText = textEl.textContent
        const originalIcon = iconEl ? iconEl.textContent : null

        textEl.textContent = "Copié !"
        if (iconEl) iconEl.textContent = "✓"

        this.element.classList.add('dashboard__copy-btn--copied')

        setTimeout(() => {
          textEl.textContent = originalText
          if (iconEl && originalIcon) iconEl.textContent = originalIcon
          this.element.classList.remove('dashboard__copy-btn--copied')
        }, 2000)
      }
    })
  }
}
