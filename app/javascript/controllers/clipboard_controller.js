import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { text: String }

  copy() {
    navigator.clipboard.writeText(this.textValue).then(() => {
      // Feedback visuel
      const btn = this.element.querySelector('.dashboard__copy-btn') || this.element
      const originalText = btn.querySelector('.dashboard__copy-text')

      if (originalText) {
        const original = originalText.textContent
        originalText.textContent = "Copié !"
        btn.style.background = "#016642"
        btn.style.color = "#fff"

        setTimeout(() => {
          originalText.textContent = original
          btn.style.background = ""
          btn.style.color = ""
        }, 2000)
      }
    })
  }
}
