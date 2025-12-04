import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    interval: { type: Number, default: 5000 } // 5 secondes par défaut
  }

  connect() {
    this.navigating = false
    this.startPolling()

    // Arrêter le refresh quand une navigation commence
    this.boundStop = () => { this.navigating = true; this.stopPolling() }
    document.addEventListener('turbo:submit-start', this.boundStop)
    document.addEventListener('turbo:before-visit', this.boundStop)
    document.addEventListener('turbo:click', this.boundStop)
  }

  disconnect() {
    this.stopPolling()
    document.removeEventListener('turbo:submit-start', this.boundStop)
    document.removeEventListener('turbo:before-visit', this.boundStop)
    document.removeEventListener('turbo:click', this.boundStop)
  }

  startPolling() {
    this.timer = setInterval(() => {
      if (!this.navigating) {
        this.refresh()
      }
    }, this.intervalValue)
  }

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  refresh() {
    // Utilise Turbo pour rafraîchir la page sans rechargement complet
    Turbo.visit(window.location.href, { action: "replace" })
  }
}
