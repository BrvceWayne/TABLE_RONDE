class GooglePlacesService
  def initialize
    @client = GOOGLE_PLACES_CLIENT
  end

  # Recherche un restaurant par son nom dans une ville
  # @param name [String] Nom du restaurant
  # @param city [String] Ville (ex: "Paris")
  # @return [GooglePlaces::Spot, nil] Le restaurant trouvé ou nil
  def find_by_name(name, city = "Paris")
    query = "#{name} restaurant #{city}"
    results = @client.spots_by_query(query)
    results.first
  end

  # Récupère les détails complets d'un restaurant via son place_id
  # @param place_id [String] L'identifiant Google Places
  # @return [GooglePlaces::Spot] Détails du restaurant
  def get_details(place_id)
    @client.spot(place_id)
  end

  # Recherche plusieurs restaurants par leurs noms et retourne leurs détails
  # @param names [Array<String>] Liste des noms de restaurants
  # @param city [String] Ville
  # @return [Array<Hash>] Liste des restaurants avec leurs détails
  def find_restaurants(names, city = "Paris")
    names.map do |name|
      spot = find_by_name(name, city)
      next nil unless spot

      # Récupérer les détails complets
      details = get_details(spot.place_id)

      {
        google_place_id: spot.place_id,
        name: details.name,
        address: details.formatted_address,
        latitude: details.lat,
        longitude: details.lng,
        phone: details.formatted_phone_number,
        rating: details.rating,
        price_level: details.price_level
      }
    end.compact
  end
end
