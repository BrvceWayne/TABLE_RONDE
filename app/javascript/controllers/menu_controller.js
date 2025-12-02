import { Controller } from "@hotwired/stimulus"

/**
 * Menu Burger Controller
 *
 * Ce controller gère l'ouverture/fermeture du menu burger.
 *
 * Comment ça marche :
 * 1. On définit des "targets" = éléments du DOM qu'on veut manipuler
 * 2. On définit des "actions" = fonctions appelées sur des événements (click, etc.)
 * 3. Stimulus connecte automatiquement le HTML au JS via data-* attributes
 */
export default class extends Controller {
  // Les "targets" sont des éléments qu'on veut manipuler
  // Dans le HTML : data-menu-target="menu" et data-menu-target="burger"
  static targets = ["menu", "burger", "overlay"]

  // Cette méthode est appelée quand le controller est connecté au DOM
  connect() {
    // On s'assure que le menu est fermé au départ
    this.isOpen = false
  }

  // Toggle = basculer entre ouvert et fermé
  // Appelé via data-action="click->menu#toggle"
  toggle() {
    this.isOpen = !this.isOpen

    if (this.isOpen) {
      this.open()
    } else {
      this.close()
    }
  }

  open() {
    // Ajoute la classe "is-open" au menu pour l'afficher
    this.menuTarget.classList.add("is-open")
    // Anime le burger en croix
    this.burgerTarget.classList.add("is-active")
    // Affiche l'overlay (fond semi-transparent)
    this.overlayTarget.classList.add("is-visible")
    // Empêche le scroll du body quand le menu est ouvert
    document.body.classList.add("menu-open")
  }

  close() {
    this.menuTarget.classList.remove("is-open")
    this.burgerTarget.classList.remove("is-active")
    this.overlayTarget.classList.remove("is-visible")
    document.body.classList.remove("menu-open")
    this.isOpen = false
  }

  // Ferme le menu si on clique sur l'overlay
  // Appelé via data-action="click->menu#closeOnOverlay"
  closeOnOverlay(event) {
    // On vérifie qu'on a bien cliqué sur l'overlay et pas sur le menu
    if (event.target === this.overlayTarget) {
      this.close()
    }
  }

  // Ferme le menu quand on appuie sur Escape
  // Pour l'activer, ajouter data-action="keydown.escape@window->menu#closeOnEscape"
  closeOnEscape(event) {
    if (this.isOpen) {
      this.close()
    }
  }
}
