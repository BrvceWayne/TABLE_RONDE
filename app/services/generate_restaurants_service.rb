class GenerateRestaurantsService
  def initialize(session, location: nil, excluded_place_ids: [])
    @session = session
    @excluded_place_ids = excluded_place_ids
    @gemini_service = GeminiService.new
    @google_service = GooglePlacesService.new
    @location = location
  end

  def call
    preferences = collect_preferences
    return [] if preferences.empty?

    # Déterminer la localisation basée sur les positions des participants
    location = determine_location(preferences)

    # Récupérer les noms des restaurants déjà exclus
    excluded_names = @session.restaurants.where(google_place_id: @excluded_place_ids).pluck(:name)

    # 1. Gemini recommande les restaurants
    gemini_recommendations = @gemini_service.recommend_restaurants(
      preferences,
      location: location,
      excluded_restaurants: excluded_names
    )

    return [] if gemini_recommendations.empty?

    # 2. Google Places récupère les infos détaillées
    restaurant_names = gemini_recommendations.map { |r| r['name'] }
    google_details = @google_service.find_restaurants(restaurant_names, location)

    # 3. Créer les restaurants en base
    create_restaurants(gemini_recommendations, google_details)
  end

  private

  def collect_preferences
    @session.users.includes(:preference).map(&:preference).compact
  end

  # Détermine la zone de recherche basée sur les positions des participants
  def determine_location(preferences)
    return @location if @location.present?

    # Chercher les participants avec une adresse
    prefs_with_address = preferences.select { |p| p.address.present? }

    if prefs_with_address.any?
      # Extraire la ville depuis les adresses (généralement le dernier élément)
      cities = prefs_with_address.map do |p|
        # L'adresse est généralement "rue, code postal, ville"
        parts = p.address.split(',').map(&:strip)
        parts.last if parts.size > 1
      end.compact

      # Prendre la ville la plus fréquente
      most_common_city = cities.group_by(&:itself).max_by { |_, v| v.size }&.first
      return most_common_city if most_common_city.present?
    end

    # Fallback: Paris par défaut
    "Paris"
  end

  def create_restaurants(gemini_recommendations, google_details)
    @session.restaurants.destroy_all

    gemini_recommendations.each_with_index.map do |recommendation, index|
      # Trouver les détails Google correspondants
      google_info = google_details.find { |g| g[:name]&.downcase&.include?(recommendation['name'].downcase.split.first) }

      @session.restaurants.create!(
        rank: index + 1,
        google_place_id: google_info&.dig(:google_place_id),
        name: google_info&.dig(:name) || recommendation['name'],
        address: google_info&.dig(:address) || recommendation['address'],
        latitude: google_info&.dig(:latitude),
        longitude: google_info&.dig(:longitude),
        phone: google_info&.dig(:phone),
        ai_explanation: recommendation['explanation']
      )
    end
  end
end
