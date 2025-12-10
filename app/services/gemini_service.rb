require 'gemini-ai'

class GeminiService
  def initialize
    @client = Gemini.new(
      credentials: { service: 'generative-language-api', api_key: ENV['GEMINI_API_KEY'] },
      options: { model: 'gemini-2.5-flash', server_sent_events: true }
    )
  end

  # Demande à Gemini de recommander des restaurants basés sur les préférences
  # @param preferences [Array<Preference>] Préférences de tous les participants
  # @param location [String] Ville ou quartier (ex: "Paris 5ème")
  # @param excluded_restaurants [Array<String>] Noms de restaurants à exclure
  # @return [Array<Hash>] Liste de restaurants recommandés avec explications
  def recommend_restaurants(preferences, location: "Paris", excluded_restaurants: [])
    prompt = build_prompt(preferences, location, excluded_restaurants)

    # Log le prompt complet
    Rails.logger.info "=" * 80
    Rails.logger.info "GEMINI PROMPT:"
    Rails.logger.info "=" * 80
    Rails.logger.info prompt
    Rails.logger.info "=" * 80

    response = @client.generate_content({ contents: { parts: { text: prompt } } })

    # Log la réponse brute
    Rails.logger.info "GEMINI RESPONSE:"
    Rails.logger.info response.inspect
    Rails.logger.info "=" * 80

    parse_response(response)
  end

  private

  def build_prompt(preferences, location, excluded_restaurants)
    # Construire la liste des positions des participants avec coordonnées GPS
    positions_text = preferences.each_with_index.map do |pref, i|
      address = pref.address.presence || "Position inconnue"
      lat = pref.latitude
      lng = pref.longitude
      max_dist = pref.max_distance || 1000
      "- Participant #{i + 1}: #{address} (GPS: #{lat}, #{lng}) - RAYON MAX: #{max_dist} mètres"
    end.join("\n")

    # Calculer le rayon de recherche le plus restrictif
    max_radius = preferences.map { |p| p.max_distance || 1000 }.min

    # Construire les préférences culinaires agrégées
    all_cuisines = preferences.flat_map { |p| p.cuisine_types || [] }.uniq
    all_restrictions = preferences.flat_map { |p| p.dietary_restrictions || [] }.uniq
    budget_min = preferences.map(&:budget_min).compact.max || 10
    budget_max = preferences.map(&:budget_max).compact.min || 50
    all_ambiances = preferences.map(&:ambiance).compact.reject(&:empty?).uniq
    all_requests = preferences.map(&:special_requests).compact.reject(&:empty?).uniq

    excluded_text = excluded_restaurants.any? ? "\nNE PAS PROPOSER: #{excluded_restaurants.join(', ')}" : ""

    <<~PROMPT
      Trouve 3 restaurants RÉELS à proximité immédiate de cette zone.

      CONTRAINTE GÉOGRAPHIQUE ABSOLUE:
      #{positions_text}

      ⚠️ IMPORTANT: Les restaurants doivent être à MAXIMUM #{max_radius} mètres de chaque participant. C'est une CONTRAINTE STRICTE, pas une préférence.

      AUTRES CRITÈRES:
      - Cuisines: #{all_cuisines.any? ? all_cuisines.join(', ') : 'Toutes'}
      - Restrictions alimentaires: #{all_restrictions.any? ? all_restrictions.join(', ') : 'Aucune'}
      - Budget: #{budget_min}€ - #{budget_max}€/personne
      - Ambiance: #{all_ambiances.any? ? all_ambiances.join(', ') : 'Peu importe'}
      #{excluded_text}

      Réponds UNIQUEMENT en JSON valide (sans ```, sans markdown):
      [
        {
          "name": "Nom exact du restaurant (tel qu'il apparaît sur Google Maps)",
          "cuisine_type": "Type de cuisine (ex: Italien, Japonais, Français...)",
          "address": "Adresse complète avec code postal",
          "price_range": "€, €€, €€€ ou €€€€",
          "rating": 4.5,
          "explanation": "2-3 phrases expliquant pourquoi ce restaurant est parfait pour le groupe"
        }
      ]
    PROMPT
  end

  def parse_response(response)
    # Extraire le texte de la réponse Gemini
    text = response.dig('candidates', 0, 'content', 'parts', 0, 'text')
    return [] unless text

    # Nettoyer le JSON (enlever les backticks markdown si présents)
    json_text = text.gsub(/```json\n?/, '').gsub(/```\n?/, '').strip

    JSON.parse(json_text)
  rescue JSON::ParserError => e
    Rails.logger.error "Gemini JSON parse error: #{e.message}"
    Rails.logger.error "Raw response: #{text}"
    []
  end
end
