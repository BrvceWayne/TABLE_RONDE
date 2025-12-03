import { Controller } from "@hotwired/stimulus"

/**
 * Question Stack Controller
 *
 * Gère un système de cartes empilées où l'utilisateur répond
 * question par question. Chaque validation fait passer à la carte suivante.
 */
export default class extends Controller {
  static targets = ["card", "progressSteps", "submitBtn"]

  connect() {
    this.currentIndex = 0
    this.totalCards = this.cardTargets.length
    this.backgrounds = ["forest", "tangerine", "sunshine", "bubblegum", "blue", "cream"]
    this.updateStack()
    this.updateProgress()
    this.updateBackground()
  }

  // Passe à la carte suivante
  next() {
    if (this.currentIndex < this.totalCards - 1) {
      // Anime la carte actuelle qui sort
      const currentCard = this.cardTargets[this.currentIndex]
      currentCard.classList.add("question-card--exiting")

      // Après l'animation, passe à la suivante
      setTimeout(() => {
        this.currentIndex++
        this.updateStack()
        this.updateProgress()
        this.updateBackground()
      }, 300)
    }
  }

  // Revient à la carte précédente
  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--
      // Retire la classe exiting de la carte précédente
      const prevCard = this.cardTargets[this.currentIndex]
      prevCard.classList.remove("question-card--exiting")
      this.updateStack()
      this.updateProgress()
      this.updateBackground()
    }
  }

  // Met à jour l'affichage du stack
  updateStack() {
    this.cardTargets.forEach((card, index) => {
      // Retire toutes les classes de position
      card.classList.remove(
        "question-card--active",
        "question-card--next",
        "question-card--next-2",
        "question-card--hidden"
      )

      if (index < this.currentIndex) {
        // Cartes déjà passées
        card.classList.add("question-card--exiting")
      } else if (index === this.currentIndex) {
        // Carte active
        card.classList.add("question-card--active")
        card.classList.remove("question-card--exiting")
      } else if (index === this.currentIndex + 1) {
        // Prochaine carte (visible derrière)
        card.classList.add("question-card--next")
      } else if (index === this.currentIndex + 2) {
        // Carte d'après (légèrement visible)
        card.classList.add("question-card--next-2")
      } else {
        // Cartes plus loin (cachées)
        card.classList.add("question-card--hidden")
      }
    })

    // Affiche le bouton submit uniquement sur la dernière carte
    if (this.hasSubmitBtnTarget) {
      if (this.currentIndex === this.totalCards - 1) {
        this.submitBtnTarget.classList.add("question-stack__submit--visible")
      } else {
        this.submitBtnTarget.classList.remove("question-stack__submit--visible")
      }
    }
  }

  // Met à jour les icônes de progression
  updateProgress() {
    if (!this.hasProgressStepsTarget) return

    const steps = this.progressStepsTarget.querySelectorAll(".progress-step")
    steps.forEach((step, index) => {
      step.classList.remove("progress-step--active", "progress-step--done")

      if (index < this.currentIndex) {
        step.classList.add("progress-step--done")
      } else if (index === this.currentIndex) {
        step.classList.add("progress-step--active")
      }
    })
  }

  // Met à jour le background selon la carte active
  updateBackground() {
    const container = this.element
    // Retire toutes les classes de background
    this.backgrounds.forEach(bg => {
      container.classList.remove(`question-stack--bg-${bg}`)
    })
    // Ajoute la classe correspondante à la carte active
    const currentBg = this.backgrounds[this.currentIndex] || "cream"
    container.classList.add(`question-stack--bg-${currentBg}`)
  }

  // Gestion du swipe sur mobile
  touchStart(event) {
    this.touchStartX = event.touches[0].clientX
    this.touchStartY = event.touches[0].clientY
  }

  touchEnd(event) {
    if (!this.touchStartX) return

    const touchEndX = event.changedTouches[0].clientX
    const touchEndY = event.changedTouches[0].clientY
    const diffX = this.touchStartX - touchEndX
    const diffY = this.touchStartY - touchEndY

    // Swipe horizontal uniquement si le mouvement horizontal > vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe gauche = next
        this.next()
      } else {
        // Swipe droite = previous
        this.previous()
      }
    }

    this.touchStartX = null
    this.touchStartY = null
  }

  // Navigation au clavier
  keydown(event) {
    if (event.key === "ArrowRight" || event.key === "Enter") {
      // Ne pas intercepter Enter sur le textarea ou les inputs
      if (event.target.tagName === "TEXTAREA" || event.target.tagName === "INPUT") {
        if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
          event.preventDefault()
          this.next()
        }
        return
      }
      event.preventDefault()
      this.next()
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      this.previous()
    }
  }
}
