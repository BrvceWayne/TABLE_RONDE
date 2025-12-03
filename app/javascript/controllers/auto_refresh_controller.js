import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    interval: { type: Number, default: 5000 } // 5 secondes par défaut
  }

  connect() {
    this.startPolling()
  }

  disconnect() {
    this.stopPolling()
  }

  startPolling() {
    this.timer = setInterval(() => {
      this.refresh()
    }, this.intervalValue)
  }

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }

  refresh() {
    // Utilise Turbo pour rafraîchir la page sans rechargement complet
    Turbo.visit(window.location.href, { action: "replace" })
  }
}
