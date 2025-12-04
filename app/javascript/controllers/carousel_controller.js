import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["card"]

  connect() {
    this.currentIndex = this.findWinnerIndex()
    this.total = this.cardTargets.length
    this.isAnimating = false

    // Initialiser le carousel
    this.updateCarousel(false)
    this.createDots()
  }

  findWinnerIndex() {
    const winnerIndex = this.cardTargets.findIndex(card =>
      card.querySelector('.restaurant-card__rank--winner')
    )
    return winnerIndex >= 0 ? winnerIndex : 0
  }

  createDots() {
    const dotsContainer = this.element.querySelector('.carousel__dots')
    if (!dotsContainer) return

    dotsContainer.innerHTML = ''
    for (let i = 0; i < this.total; i++) {
      const dot = document.createElement('button')
      dot.className = `carousel__dot ${i === this.currentIndex ? 'carousel__dot--active' : ''}`
      dot.dataset.index = i
      dot.dataset.action = 'click->carousel#goTo'
      dotsContainer.appendChild(dot)
    }
  }

  updateDots() {
    const dots = this.element.querySelectorAll('.carousel__dot')
    dots.forEach((dot, i) => {
      dot.classList.toggle('carousel__dot--active', i === this.currentIndex)
    })
  }

  prev() {
    if (this.isAnimating) return
    this.currentIndex = (this.currentIndex - 1 + this.total) % this.total
    this.updateCarousel(true)
  }

  next() {
    if (this.isAnimating) return
    this.currentIndex = (this.currentIndex + 1) % this.total
    this.updateCarousel(true)
  }

  goTo(event) {
    if (this.isAnimating) return
    const index = parseInt(event.currentTarget.dataset.index)
    if (index !== this.currentIndex) {
      this.currentIndex = index
      this.updateCarousel(true)
    }
  }

  getPosition(index) {
    // Position relative: -1 (gauche), 0 (centre), 1 (droite)
    let diff = index - this.currentIndex

    // Wrap around pour effet circulaire
    if (diff > Math.floor(this.total / 2)) {
      diff -= this.total
    } else if (diff < -Math.floor(this.total / 2)) {
      diff += this.total
    }

    return diff
  }

  updateCarousel(animate = true) {
    if (animate) this.isAnimating = true

    this.cardTargets.forEach((card, index) => {
      const position = this.getPosition(index)

      // Reset classes
      card.classList.remove('carousel__card--center', 'carousel__card--left', 'carousel__card--right', 'carousel__card--hidden')

      if (position === 0) {
        // Centre
        card.classList.add('carousel__card--center')
        card.style.transform = 'translate(-50%, -50%) translateZ(0) rotateY(0deg) scale(1)'
        card.style.opacity = '1'
        card.style.zIndex = '30'
        card.style.filter = 'none'
      } else if (position === -1) {
        // Gauche
        card.classList.add('carousel__card--left')
        card.style.transform = 'translate(-140%, -50%) translateZ(-200px) rotateY(35deg) scale(0.8)'
        card.style.opacity = '0.7'
        card.style.zIndex = '20'
        card.style.filter = 'blur(1px)'
      } else if (position === 1) {
        // Droite
        card.classList.add('carousel__card--right')
        card.style.transform = 'translate(40%, -50%) translateZ(-200px) rotateY(-35deg) scale(0.8)'
        card.style.opacity = '0.7'
        card.style.zIndex = '20'
        card.style.filter = 'blur(1px)'
      } else {
        // Cachées (pour plus de 3 cartes)
        card.classList.add('carousel__card--hidden')
        const direction = position < 0 ? -1 : 1
        card.style.transform = `translate(${direction * 200}%, -50%) translateZ(-400px) scale(0.5)`
        card.style.opacity = '0'
        card.style.zIndex = '0'
        card.style.filter = 'blur(2px)'
      }
    })

    this.updateDots()

    if (animate) {
      setTimeout(() => {
        this.isAnimating = false
      }, 600)
    }
  }
}
