import { Controller } from "@hotwired/stimulus"

/**
 * User Menu Controller
 *
 * Gère le dropdown du menu utilisateur (avatar)
 */
export default class extends Controller {
  static targets = ["container", "menu"]

  connect() {
    // Ferme le menu si on clique ailleurs
    this.clickOutsideHandler = this.clickOutside.bind(this)
    document.addEventListener("click", this.clickOutsideHandler)
  }

  disconnect() {
    document.removeEventListener("click", this.clickOutsideHandler)
  }

  toggle(event) {
    event.stopPropagation()
    this.menuTarget.classList.toggle("is-open")
    this.containerTarget.classList.toggle("is-open")
  }

  close() {
    this.menuTarget.classList.remove("is-open")
    this.containerTarget.classList.remove("is-open")
  }

  clickOutside(event) {
    if (!this.containerTarget.contains(event.target)) {
      this.close()
    }
  }
}
