import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["latitude", "longitude", "address", "button", "status"]

  connect() {
    if (!navigator.geolocation) {
      this.showStatus("Géolocalisation non supportée par votre navigateur", "error")
    }

    this.initGoogleAutocomplete()
  }

  initGoogleAutocomplete() {
    if (typeof google === "undefined" || !google.maps || !google.maps.places) {
      this.retryCount = (this.retryCount || 0) + 1
      if (this.retryCount > 20) {
        console.error("Google Maps API failed to load after 10 seconds")
        return
      }
      setTimeout(() => this.initGoogleAutocomplete(), 500)
      return
    }

    // Create the PlaceAutocompleteElement (New API)
    this.placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
      componentRestrictions: { country: "fr" },
      types: ["address"]
    })

    // Style to match our input design
    this.placeAutocomplete.style.cssText = `
      width: 100%;
      max-width: 320px;
      --gmpx-color-surface: rgba(255, 255, 255, 0.15);
      --gmpx-color-on-surface: white;
      --gmpx-color-on-surface-variant: rgba(255, 255, 255, 0.5);
      --gmpx-color-outline: rgba(255, 255, 255, 0.3);
      --gmpx-color-primary: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.15);
    `

    // Hide the original input and insert the autocomplete element
    this.addressTarget.style.display = "none"
    this.addressTarget.parentNode.insertBefore(this.placeAutocomplete, this.addressTarget.nextSibling)

    // Handle place selection
    this.placeAutocomplete.addEventListener("gmp-placeselect", async (event) => {
      const place = event.place
      await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] })

      if (place.location) {
        this.latitudeTarget.value = place.location.lat()
        this.longitudeTarget.value = place.location.lng()
        this.addressTarget.value = place.formattedAddress || place.displayName
        this.showStatus("Adresse sélectionnée", "success")
      }
    })
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

    this.latitudeTarget.value = latitude
    this.longitudeTarget.value = longitude

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

  updateAddressDisplay(address) {
    this.addressTarget.value = address

    if (this.placeAutocomplete) {
      this.placeAutocomplete.style.display = "none"
      this.addressTarget.style.display = "block"
      this.addressTarget.value = address

      if (!this.addressClickHandler) {
        this.addressClickHandler = () => {
          this.addressTarget.style.display = "none"
          this.placeAutocomplete.style.display = "block"
        }
        this.addressTarget.addEventListener("focus", this.addressClickHandler)
      }
    }
  }

  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`
      )
      const data = await response.json()

      if (data.display_name) {
        const parts = []
        if (data.address.house_number) parts.push(data.address.house_number)
        if (data.address.road) parts.push(data.address.road)
        if (data.address.postcode) parts.push(data.address.postcode)
        if (data.address.city || data.address.town || data.address.village || data.address.municipality) {
          parts.push(data.address.city || data.address.town || data.address.village || data.address.municipality)
        }

        const shortAddress = parts.length > 0 ? parts.join(", ") : data.display_name.split(",").slice(0, 3).join(",")
        this.updateAddressDisplay(shortAddress)
      } else {
        this.updateAddressDisplay(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      }
    } catch (e) {
      console.error("Reverse geocoding error:", e)
      this.updateAddressDisplay(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }

  showStatus(message, type) {
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = message
      this.statusTarget.className = `geolocation-status geolocation-status--${type}`
    }
  }
}
