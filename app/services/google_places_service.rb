require 'net/http'
require 'json'

class GooglePlacesService
  BASE_URL = "https://places.googleapis.com/v1/places"

  def initialize
    @api_key = ENV['GOOGLE_PLACES_API_KEY']
  end

  # Recherche un restaurant par son nom et sa ville
  # @param name [String] Nom du restaurant
  # @param city [String] Ville (ex: "Paris")
  # @return [Hash, nil] Résultat de la recherche ou nil
  def search_restaurant(name, city = "Paris")
    uri = URI("#{BASE_URL}:searchText")

    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request["X-Goog-Api-Key"] = @api_key
    request["X-Goog-FieldMask"] = "places.id,places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.websiteUri,places.nationalPhoneNumber,places.currentOpeningHours,places.photos,places.location"

    request.body = {
      textQuery: "#{name} restaurant #{city}",
      languageCode: "fr"
    }.to_json

    response = make_request(uri, request)
    return nil unless response && response["places"]&.any?

    response["places"].first
  end

  # Enrichit un restaurant avec les données Google Places
  # @param name [String] Nom du restaurant
  # @param address [String] Adresse du restaurant
  # @return [Hash, nil] Données enrichies ou nil
  def enrich_restaurant(name, address)
    city = extract_city(address)
    place = search_restaurant(name, city)
    return nil unless place

    {
      google_place_id: place["id"],
      phone: place["nationalPhoneNumber"],
      website: place["websiteUri"],
      rating: place["rating"],
      price_level: parse_price_level(place["priceLevel"]),
      latitude: place.dig("location", "latitude"),
      longitude: place.dig("location", "longitude"),
      photo_url: build_photo_url(place),
      is_open_now: place.dig("currentOpeningHours", "openNow"),
      opening_hours: format_opening_hours(place["currentOpeningHours"])
    }
  rescue StandardError => e
    Rails.logger.error "Google Places enrichment error for #{name}: #{e.message}"
    nil
  end

  private

  def make_request(uri, request)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    # Désactiver la vérification SSL en dev (problème CRL sur macOS)
    http.verify_mode = Rails.env.development? ? OpenSSL::SSL::VERIFY_NONE : OpenSSL::SSL::VERIFY_PEER
    http.read_timeout = 10
    http.open_timeout = 5

    response = http.request(request)

    if response.code == "200"
      JSON.parse(response.body)
    else
      Rails.logger.error "Google Places API error: #{response.code} - #{response.body}"
      nil
    end
  rescue StandardError => e
    Rails.logger.error "Google Places request error: #{e.message}"
    nil
  end

  def build_photo_url(place)
    return nil unless place["photos"]&.any?

    photo_name = place["photos"].first["name"]
    # La nouvelle API utilise un format différent pour les photos
    "https://places.googleapis.com/v1/#{photo_name}/media?maxWidthPx=400&key=#{@api_key}"
  end

  def format_opening_hours(opening_hours)
    return nil unless opening_hours && opening_hours["weekdayDescriptions"]

    opening_hours["weekdayDescriptions"].join("\n")
  end

  def parse_price_level(price_level)
    return nil unless price_level

    # La nouvelle API retourne des valeurs comme "PRICE_LEVEL_MODERATE"
    case price_level
    when "PRICE_LEVEL_FREE" then 0
    when "PRICE_LEVEL_INEXPENSIVE" then 1
    when "PRICE_LEVEL_MODERATE" then 2
    when "PRICE_LEVEL_EXPENSIVE" then 3
    when "PRICE_LEVEL_VERY_EXPENSIVE" then 4
    else 2
    end
  end

  def extract_city(address)
    return "Paris" unless address.present?

    parts = address.split(',').map(&:strip)
    parts.last&.gsub(/\d{5}\s*/, '')&.strip || "Paris"
  end
end
