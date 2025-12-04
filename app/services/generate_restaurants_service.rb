class GenerateRestaurantsService
  def initialize(session, location: nil, excluded_place_ids: [])
    @session = session
    @excluded_place_ids = excluded_place_ids
    @gemini_service = GeminiService.new
    @google_places_service = GooglePlacesService.new
    @location = location
  end

  def call
    preferences = collect_preferences
    return [] if preferences.empty?

    # Déterminer la localisation basée sur les positions des participants
    location = determine_location(preferences)

    # Récupérer les noms des restaurants déjà exclus
    excluded_names = @session.restaurants.where(google_place_id: @excluded_place_ids).pluck(:name)

    # Gemini recommande les restaurants avec toutes les infos
    gemini_recommendations = @gemini_service.recommend_restaurants(
      preferences,
      location: location,
      excluded_restaurants: excluded_names
    )

    return [] if gemini_recommendations.empty?

    # Créer les restaurants en base directement avec les données Gemini
    create_restaurants(gemini_recommendations)
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

  def create_restaurants(gemini_recommendations)
    @session.restaurants.destroy_all

    gemini_recommendations.each_with_index.map do |recommendation, index|
      # Données de base depuis Gemini
      restaurant_data = {
        rank: index + 1,
        name: recommendation['name'],
        address: recommendation['address'],
        cuisine_type: recommendation['cuisine_type'],
        ai_explanation: recommendation['explanation'],
        rating: recommendation['rating'],
        price_level: parse_price_level(recommendation['price_range'])
      }

      # Enrichir avec Google Places (photo, horaires, etc.)
      enriched_data = @google_places_service.enrich_restaurant(
        recommendation['name'],
        recommendation['address']
      )

      if enriched_data
        restaurant_data.merge!(
          google_place_id: enriched_data[:google_place_id],
          phone: enriched_data[:phone],
          website: enriched_data[:website],
          latitude: enriched_data[:latitude],
          longitude: enriched_data[:longitude],
          photo_url: enriched_data[:photo_url],
          is_open_now: enriched_data[:is_open_now],
          opening_hours: enriched_data[:opening_hours]
        )
        # Utiliser le rating Google Places si disponible (plus fiable)
        restaurant_data[:rating] = enriched_data[:rating] if enriched_data[:rating]
        restaurant_data[:price_level] = enriched_data[:price_level] if enriched_data[:price_level]
      end

      @session.restaurants.create!(restaurant_data)
    end
  end

  def parse_price_level(price_range)
    return nil unless price_range

    case price_range.to_s.count('€')
    when 1 then 1
    when 2 then 2
    when 3 then 3
    when 4 then 4
    else 2 # Défaut
    end
  end
end
