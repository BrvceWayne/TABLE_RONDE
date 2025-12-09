import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "text", "icon"]
  static values = {
    loadingText: { type: String, default: "Génération en cours" }
  }

  submit(event) {
    // Désactive le bouton
    this.buttonTarget.disabled = true
    this.buttonTarget.classList.add("dashboard__btn--loading")

    // Change le texte et l'icône
    if (this.hasIconTarget) {
      this.iconTarget.innerHTML = ""
      this.iconTarget.classList.add("loading-spinner")
    }

    if (this.hasTextTarget) {
      this.originalText = this.textTarget.textContent
      this.startLoadingAnimation()
    }
  }

  startLoadingAnimation() {
    const messages = [
      "Analyse des préférences",
      "Recherche des restaurants",
      "Calcul des compatibilités",
      "Sélection des meilleures options",
      "Finalisation des recommandations"
    ]

    let index = 0
    this.textTarget.textContent = messages[0]

    this.interval = setInterval(() => {
      index = (index + 1) % messages.length
      this.textTarget.textContent = messages[index]
    }, 2500)
  }

  disconnect() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }
}
