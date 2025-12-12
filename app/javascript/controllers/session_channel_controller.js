import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = {
    shareCode: String
  }

  connect() {
    this.lastUpdate = Date.now()
    this.setupChannel()
    this.setupVisibilityHandler()
    this.startPolling()
  }

  disconnect() {
    if (this.channel) {
      this.channel.unsubscribe()
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
    document.removeEventListener("visibilitychange", this.visibilityHandler)
  }

  setupChannel() {
    this.channel = createConsumer().subscriptions.create(
      { channel: "SessionChannel", share_code: this.shareCodeValue },
      {
        received: (data) => {
          this.handleMessage(data)
        }
      }
    )
  }

  // Rafraîchir quand l'app revient au premier plan (PWA)
  setupVisibilityHandler() {
    this.visibilityHandler = () => {
      if (document.visibilityState === "visible") {
        // Si l'app était en arrière-plan plus de 5 secondes, rafraîchir
        if (Date.now() - this.lastUpdate > 5000) {
          this.refresh()
        }
      }
      this.lastUpdate = Date.now()
    }
    document.addEventListener("visibilitychange", this.visibilityHandler)
  }

  // Polling de fallback toutes les 10 secondes (au cas où WebSocket échoue)
  startPolling() {
    this.pollingInterval = setInterval(() => {
      // Seulement si la page est visible
      if (document.visibilityState === "visible") {
        this.checkForUpdates()
      }
    }, 10000)
  }

  async checkForUpdates() {
    try {
      const response = await fetch(window.location.href, {
        headers: { "Accept": "text/html" }
      })
      const html = await response.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      // Comparer le nombre de participants et leur statut
      const currentParticipants = this.element.querySelectorAll(".dashboard__participant-card").length
      const newParticipants = doc.querySelectorAll(".dashboard__participant-card").length

      const currentCompleted = this.element.querySelectorAll(".dashboard__status-badge--success").length
      const newCompleted = doc.querySelectorAll(".dashboard__status-badge--success").length

      if (currentParticipants !== newParticipants || currentCompleted !== newCompleted) {
        this.refresh()
      }
    } catch (e) {
      // Silently fail
    }
  }

  handleMessage(data) {
    if (data.type === "participant_joined" || data.type === "preferences_updated" || data.type === "restaurants_generated") {
      this.refresh()
    }
  }

  refresh() {
    this.lastUpdate = Date.now()
    Turbo.visit(window.location.href, { action: "replace" })
  }
}
