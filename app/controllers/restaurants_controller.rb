class RestaurantsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :show]
  before_action :find_session

  # PHASE 5: Affichage des recommandations (principal + 2 alternatives)
  def index
    @restaurants = @session.restaurants.order(:rank).limit(3)

    if @restaurants.empty?
      redirect_to dashboard_session_path(@session), alert: "Aucune recommandation n'a encore été générée"
    end
  end

  # PHASE 5: Détails d'un restaurant spécifique
  def show
    @restaurant = @session.restaurants.find(params[:id])

    # Récupérer les détails Google Places si on a un place_id
    if @restaurant.google_place_id.present?
      begin
        google_service = GooglePlacesService.new
        @google_details = google_service.get_details(@restaurant.google_place_id)
      rescue => e
        Rails.logger.error "Google Places error: #{e.message}"
        @google_details = nil
      end
    end
  end

  # PHASE 6: Demander une nouvelle recommandation (alternative aux 3 proposées)
  def regenerate
    user = current_or_guest_user
    session_user = @session.session_users.find_by(user: user)

    unless session_user&.leader?
      redirect_to session_restaurants_path(@session), alert: "Seul le leader peut générer de nouvelles recommandations"
      return
    end

    # Récupérer les IDs des restaurants déjà proposés pour les exclure
    excluded_ids = @session.restaurants.pluck(:google_place_id).compact

    # Appeler le service avec les IDs exclus pour obtenir de nouvelles recommandations
    GenerateRestaurantsService.new(@session, excluded_place_ids: excluded_ids).call

    redirect_to session_restaurants_path(@session), notice: "Nouvelles recommandations générées !"
  end

  private

  def find_session
    @session = Session.find_by!(share_code: params[:session_share_code])
  end
end
