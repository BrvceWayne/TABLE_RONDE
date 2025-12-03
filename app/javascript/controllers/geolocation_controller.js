import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["latitude", "longitude", "address", "button", "status"]

  connect() {
    // Vérifier si la géolocalisation est disponible
    if (!navigator.geolocation) {
      this.showStatus("Géolocalisation non supportée par votre navigateur", "error")
    }
  }

  locate() {
    this.showStatus("Localisation en cours...", "loading")
    this.buttonTarget.disabled = true

    navigator.geolocation.getCurrentPosition(
      (position) => this.success(position),
      (error) => this.error(error),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  success(position) {
    const { latitude, longitude } = position.coords

    // Mettre à jour les champs cachés
    this.latitudeTarget.value = latitude
    this.longitudeTarget.value = longitude

    // Reverse geocoding pour afficher l'adresse
    this.reverseGeocode(latitude, longitude)

    this.showStatus("Position trouvée !", "success")
    this.buttonTarget.disabled = false
  }

  error(error) {
    let message = "Erreur de localisation"
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "Vous avez refusé la géolocalisation"
        break
      case error.POSITION_UNAVAILABLE:
        message = "Position non disponible"
        break
      case error.TIMEOUT:
        message = "Délai dépassé"
        break
    }
    this.showStatus(message, "error")
    this.buttonTarget.disabled = false
  }

  async reverseGeocode(lat, lng) {
    try {
      // Utiliser Nominatim (gratuit) pour le reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      const data = await response.json()

      if (data.display_name) {
        // Extraire une adresse courte
        const parts = []
        if (data.address.road) parts.push(data.address.road)
        if (data.address.house_number) parts.unshift(data.address.house_number)
        if (data.address.postcode) parts.push(data.address.postcode)
        if (data.address.city || data.address.town || data.address.village) {
          parts.push(data.address.city || data.address.town || data.address.village)
        }

        const shortAddress = parts.join(", ") || data.display_name.split(",").slice(0, 3).join(",")
        this.addressTarget.value = shortAddress
      }
    } catch (e) {
      console.error("Reverse geocoding error:", e)
      this.addressTarget.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  showStatus(message, type) {
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = message
      this.statusTarget.className = `geolocation-status geolocation-status--${type}`
    }
  }
}
