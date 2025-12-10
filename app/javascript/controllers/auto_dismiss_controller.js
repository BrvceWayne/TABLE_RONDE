import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    // Auto-dismiss après 4 secondes
    this.timeout = setTimeout(() => {
      this.dismiss()
    }, 4000)
  }

  disconnect() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  }

  dismiss() {
    this.element.classList.add("alert-dismissing")
    setTimeout(() => {
      this.element.remove()
    }, 300)
  }
}
