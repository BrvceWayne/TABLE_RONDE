import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { url: String }

  start(event) {
    event.preventDefault()

    // Créer et afficher l'overlay
    this.createOverlay()

    // Démarrer les animations
    this.startAnimations()

    // Lancer la requête
    this.generateRestaurants()
  }

  createOverlay() {
    this.overlay = document.createElement('div')
    this.overlay.className = 'generate-overlay'
    this.overlay.innerHTML = `
      <div class="generate-overlay__backdrop"></div>
      <div class="generate-overlay__content">
        <div class="generate-overlay__animation">
          <div class="generate-overlay__chef">
            <span class="generate-overlay__chef-emoji">👨‍🍳</span>
          </div>
          <div class="generate-overlay__icons">
            <span class="generate-overlay__icon generate-overlay__icon--1">🍕</span>
            <span class="generate-overlay__icon generate-overlay__icon--2">🍜</span>
            <span class="generate-overlay__icon generate-overlay__icon--3">🍣</span>
            <span class="generate-overlay__icon generate-overlay__icon--4">🥗</span>
            <span class="generate-overlay__icon generate-overlay__icon--5">🍔</span>
            <span class="generate-overlay__icon generate-overlay__icon--6">🌮</span>
          </div>
        </div>
        <h2 class="generate-overlay__title">On cherche vos restos...</h2>
        <p class="generate-overlay__message">Analyse des préférences</p>
        <div class="generate-overlay__progress">
          <div class="generate-overlay__progress-bar"></div>
        </div>
      </div>
    `

    document.body.appendChild(this.overlay)

    // Forcer le reflow pour l'animation
    this.overlay.offsetHeight

    // Activer l'animation d'apparition
    requestAnimationFrame(() => {
      this.overlay.classList.add('generate-overlay--visible')
    })

    // Références aux éléments
    this.messageEl = this.overlay.querySelector('.generate-overlay__message')
    this.progressBar = this.overlay.querySelector('.generate-overlay__progress-bar')
  }

  startAnimations() {
    this.messages = [
      "Analyse des préférences",
      "Recherche des restaurants",
      "Calcul des compatibilités",
      "Sélection des meilleures options",
      "Finalisation..."
    ]
    this.currentIndex = 0
    this.progress = 0

    // Animation des messages
    this.messageInterval = setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.messages.length
      if (this.messageEl) {
        this.messageEl.style.opacity = 0
        setTimeout(() => {
          this.messageEl.textContent = this.messages[this.currentIndex]
          this.messageEl.style.opacity = 1
        }, 200)
      }
    }, 2500)

    // Animation de la barre de progression
    this.progressInterval = setInterval(() => {
      if (this.progress < 85) {
        this.progress += Math.random() * 5
        if (this.progress > 85) this.progress = 85
        this.updateProgressBar()
      }
    }, 400)
  }

  updateProgressBar() {
    if (this.progressBar) {
      this.progressBar.style.width = `${this.progress}%`
    }
  }

  async generateRestaurants() {
    try {
      const response = await fetch(this.urlValue, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success && data.redirect_url) {
        // Compléter à 100%
        this.progress = 100
        this.updateProgressBar()

        if (this.messageEl) {
          this.messageEl.textContent = "C'est prêt ! 🎉"
        }

        // Redirection après une courte pause
        setTimeout(() => {
          window.location.href = data.redirect_url
        }, 600)
      } else {
        this.handleError(data.error || "Une erreur est survenue")
      }
    } catch (error) {
      console.error("Erreur:", error)
      this.handleError("Erreur de connexion")
    }
  }

  handleError(message) {
    if (this.messageEl) {
      this.messageEl.textContent = message
      this.messageEl.classList.add('generate-overlay__message--error')
    }

    // Fermer l'overlay après 2 secondes
    setTimeout(() => {
      this.closeOverlay()
    }, 2000)
  }

  closeOverlay() {
    if (this.overlay) {
      this.overlay.classList.remove('generate-overlay--visible')
      setTimeout(() => {
        this.overlay.remove()
      }, 300)
    }
    this.cleanup()
  }

  cleanup() {
    if (this.messageInterval) clearInterval(this.messageInterval)
    if (this.progressInterval) clearInterval(this.progressInterval)
  }

  disconnect() {
    this.cleanup()
    if (this.overlay) this.overlay.remove()
  }
}
