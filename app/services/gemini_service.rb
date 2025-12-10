require 'gemini-ai'

class GeminiService
  def initialize
    @client = Gemini.new(
      credentials: { service: 'generative-language-api', api_key: ENV['GEMINI_API_KEY'] },
      options: { model: 'gemini-2.0-flash', server_sent_events: true }
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
      "- Participant #{i + 1}: #{address} (GPS: #{lat}, #{lng}) - Distance max acceptée: #{max_dist}m"
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

    excluded_text = excluded_restaurants.any? ? "\n❌ RESTAURANTS EXCLUS (ne pas proposer): #{excluded_restaurants.join(', ')}" : ""
    requests_text = all_requests.any? ? "\n💬 DEMANDES SPÉCIALES: #{all_requests.join(' | ')}" : ""

    <<~PROMPT
      Tu es un expert gastronomique. Tu DOIS retourner EXACTEMENT 3 restaurants, ni plus ni moins.

      🎯 MISSION: Recommander 3 restaurants pour un groupe de #{preferences.size} personne(s).

      📍 ZONE DE RECHERCHE:
      #{positions_text}
      Zone cible: rayon de #{max_radius} mètres autour des participants.

      👥 PRÉFÉRENCES (à respecter au mieux):
      - Cuisines: #{all_cuisines.any? ? all_cuisines.join(', ') : 'Toutes cuisines'}
      - Restrictions alimentaires: #{all_restrictions.any? ? all_restrictions.join(', ') : 'Aucune'}
      - Budget: #{budget_min}€ - #{budget_max}€ par personne
      - Ambiance: #{all_ambiances.any? ? all_ambiances.join(', ') : 'Peu importe'}#{requests_text}#{excluded_text}

      ⚠️ RÈGLES ABSOLUES:
      1. Tu DOIS retourner EXACTEMENT 3 restaurants - JAMAIS moins, JAMAIS plus
      2. Les restaurants doivent EXISTER réellement (vérifiables sur Google Maps)
      3. Respecter les restrictions alimentaires est OBLIGATOIRE
      4. Si les critères sont trop restrictifs, ÉLARGIS la zone de recherche mais retourne TOUJOURS 3 restaurants
      5. Privilégie les restaurants bien notés (≥ 4.0 étoiles)

      📋 RÉPONDS UNIQUEMENT AVEC CE JSON (sans ```, sans texte autour):
      [
        {
          "name": "Nom EXACT tel qu'affiché sur Google Maps",
          "cuisine_type": "Type de cuisine",
          "address": "Adresse complète avec code postal",
          "price_range": "€ ou €€ ou €€€ ou €€€€",
          "rating": 4.5,
          "explanation": "2-3 phrases expliquant pourquoi ce resto convient au groupe"
        },
        {
          "name": "Deuxième restaurant",
          "cuisine_type": "...",
          "address": "...",
          "price_range": "...",
          "rating": 4.2,
          "explanation": "..."
        },
        {
          "name": "Troisième restaurant",
          "cuisine_type": "...",
          "address": "...",
          "price_range": "...",
          "rating": 4.0,
          "explanation": "..."
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
