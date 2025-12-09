import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["trigger", "form", "input", "submit"]

  connect() {
    this.isExpanded = false
  }

  expand(event) {
    event.preventDefault()
    this.isExpanded = true

    // Cacher le bouton trigger
    this.triggerTarget.classList.add("home__join-trigger--hidden")

    // Afficher le formulaire
    this.formTarget.classList.add("home__join-form--visible")

    // Focus sur l'input après l'animation
    setTimeout(() => {
      this.inputTarget.focus()
    }, 300)
  }

  collapse(event) {
    if (event) event.preventDefault()
    this.isExpanded = false

    // Cacher le formulaire
    this.formTarget.classList.remove("home__join-form--visible")

    // Réafficher le bouton trigger
    this.triggerTarget.classList.remove("home__join-trigger--hidden")

    // Réinitialiser l'input
    this.inputTarget.value = ""
    this.submitTarget.disabled = true
  }

  handleInput(event) {
    const value = this.inputTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    this.inputTarget.value = value

    // Activer le bouton submit si le code a au moins 6 caractères
    this.submitTarget.disabled = value.length < 6

    // Auto-submit si 8 caractères
    if (value.length === 8) {
      this.submitTarget.classList.add("home__join-submit--ready")
    } else {
      this.submitTarget.classList.remove("home__join-submit--ready")
    }
  }

  // Fermer si on clique en dehors
  clickOutside(event) {
    if (this.isExpanded && !this.element.contains(event.target)) {
      this.collapse()
    }
  }
}
