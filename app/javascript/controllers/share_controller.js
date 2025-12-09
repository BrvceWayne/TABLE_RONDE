import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button"]
  static values = {
    url: String,
    title: String,
    text: String
  }

  connect() {
    // Masquer le bouton si l'API Web Share n'est pas disponible
    if (!navigator.share && this.hasButtonTarget) {
      this.buttonTarget.style.display = "none"
    }
  }

  async share(event) {
    event.preventDefault()

    if (navigator.share) {
      try {
        await navigator.share({
          title: this.titleValue,
          text: this.textValue,
          url: this.urlValue
        })
      } catch (error) {
        // L'utilisateur a annulé ou erreur
        if (error.name !== "AbortError") {
          console.error("Erreur de partage:", error)
          // Fallback: copier le lien
          this.copyToClipboard()
        }
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas Web Share
      this.copyToClipboard()
    }
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.urlValue).then(() => {
      // Afficher un feedback
      const button = this.buttonTarget
      const originalText = button.querySelector("span:last-child").textContent
      button.querySelector("span:last-child").textContent = "Copié !"
      button.classList.add("dashboard__share-btn--success")

      setTimeout(() => {
        button.querySelector("span:last-child").textContent = originalText
        button.classList.remove("dashboard__share-btn--success")
      }, 2000)
    })
  }
}
