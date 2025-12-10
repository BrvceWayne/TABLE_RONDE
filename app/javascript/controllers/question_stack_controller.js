import { Controller } from "@hotwired/stimulus"

/**
 * Question Stack Controller
 *
 * Gère un système de cartes empilées où l'utilisateur répond
 * question par question. Chaque validation fait passer à la carte suivante.
 */
export default class extends Controller {
  static targets = ["card", "progressSteps", "submitBtn", "budgetMin", "budgetMax", "ambianceHidden"]

  connect() {
    this.currentIndex = 0
    this.totalCards = this.cardTargets.length
    this.backgrounds = ["forest", "tangerine", "sunshine", "bubblegum", "blue", "cream"]
    this.updateStack()
    this.updateProgress()
    this.updateBackground()
    this.setupBudgetLevelListeners()
    this.setupAmbianceTagListeners()
    this.updateAllNextButtons()
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
        "question-card--next-3",
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
        // Carte d'après
        card.classList.add("question-card--next-2")
      } else if (index === this.currentIndex + 3) {
        // Troisième carte visible
        card.classList.add("question-card--next-3")
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

  // Navigation directe vers un step
  goToStep(event) {
    const targetIndex = parseInt(event.currentTarget.dataset.step, 10)
    if (targetIndex === this.currentIndex || isNaN(targetIndex)) return

    // Retire les classes d'animation des anciennes cartes
    this.cardTargets.forEach(card => {
      card.classList.remove("question-card--exiting")
    })

    this.currentIndex = targetIndex
    this.updateStack()
    this.updateProgress()
    this.updateBackground()
  }

  // Gestion du swipe sur mobile
  touchStart(event) {
    this.touchStartX = event.touches[0].clientX
    this.touchStartY = event.touches[0].clientY
    this.isSwiping = false
  }

  touchMove(event) {
    if (!this.touchStartX) return

    const touchX = event.touches[0].clientX
    const touchY = event.touches[0].clientY
    const diffX = Math.abs(this.touchStartX - touchX)
    const diffY = Math.abs(this.touchStartY - touchY)

    // Si le mouvement est plus horizontal que vertical, empêche le scroll de la page
    if (diffX > diffY && diffX > 10) {
      event.preventDefault()
      this.isSwiping = true
    }
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
    this.isSwiping = false
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

  // Configure les listeners pour les niveaux de budget
  setupBudgetLevelListeners() {
    const budgetInputs = this.element.querySelectorAll('.budget-level__input')
    budgetInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const min = e.target.dataset.budgetMin
        const max = e.target.dataset.budgetMax
        if (this.hasBudgetMinTarget) this.budgetMinTarget.value = min
        if (this.hasBudgetMaxTarget) this.budgetMaxTarget.value = max
        this.updateNextButtonForCard(2) // Card 3 (index 2)
      })
    })
  }

  // Configure les listeners pour les tags d'ambiance
  setupAmbianceTagListeners() {
    const ambianceCheckboxes = this.element.querySelectorAll('input[name="preference[ambiance_tags][]"]')
    ambianceCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateAmbianceHidden()
        this.updateNextButtonForCard(4) // Card 5 (index 4)
      })
    })
  }

  // Met à jour le champ caché ambiance avec les valeurs sélectionnées
  updateAmbianceHidden() {
    const checkedBoxes = this.element.querySelectorAll('input[name="preference[ambiance_tags][]"]:checked')
    const values = Array.from(checkedBoxes).map(cb => cb.value)
    if (this.hasAmbianceHiddenTarget) {
      this.ambianceHiddenTarget.value = values.join(', ')
    }
  }

  // Met à jour le texte du bouton suivant selon si des données sont entrées
  updateNextButtonForCard(cardIndex) {
    const card = this.cardTargets[cardIndex]
    if (!card) return

    const nextBtn = card.querySelector('.question-card__next-btn')
    if (!nextBtn) return

    const hasInput = this.cardHasInput(cardIndex)
    const icon = nextBtn.querySelector('i')
    const iconHtml = icon ? icon.outerHTML : '<i class="fa-solid fa-arrow-right"></i>'

    if (hasInput) {
      nextBtn.innerHTML = `Suivant ${iconHtml}`
    } else {
      nextBtn.innerHTML = `Pas de préférence ${iconHtml}`
    }
  }

  // Vérifie si une carte a des données entrées
  cardHasInput(cardIndex) {
    const card = this.cardTargets[cardIndex]
    if (!card) return false

    // Checkboxes cochées
    const checkedCheckboxes = card.querySelectorAll('input[type="checkbox"]:checked')
    if (checkedCheckboxes.length > 0) return true

    // Radio buttons cochés (sauf ceux avec valeur par défaut)
    const checkedRadios = card.querySelectorAll('input[type="radio"]:checked')
    if (checkedRadios.length > 0) return true

    // Inputs texte non vides
    const textInputs = card.querySelectorAll('input[type="text"], textarea')
    for (let input of textInputs) {
      if (input.value.trim() !== '') return true
    }

    return false
  }

  // Met à jour tous les boutons au chargement
  updateAllNextButtons() {
    for (let i = 0; i < this.totalCards; i++) {
      this.updateNextButtonForCard(i)
    }

    // Ajoute des listeners sur tous les inputs pour mettre à jour les boutons
    this.cardTargets.forEach((card, index) => {
      const inputs = card.querySelectorAll('input, textarea')
      inputs.forEach(input => {
        input.addEventListener('change', () => this.updateNextButtonForCard(index))
        if (input.type === 'text' || input.tagName === 'TEXTAREA') {
          input.addEventListener('input', () => this.updateNextButtonForCard(index))
        }
      })
    })
  }
}
