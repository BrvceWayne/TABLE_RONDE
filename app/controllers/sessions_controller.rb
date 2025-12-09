class SessionsController < ApplicationController
  before_action :set_session, only: [:show, :dashboard, :generate_recommendations, :destroy]
  skip_before_action :authenticate_user!, only: [:show, :dashboard, :join_redirect]

  # Mes sessions - Liste de toutes les sessions de l'utilisateur
  def index
    @sessions = current_user.sessions
                            .includes(:users, :restaurants)
                            .order(created_at: :desc)
  end

  # PHASE 1: Alice crée une nouvelle session
  def new
    @session = Session.new
  end

  def create
    # Utilise current_or_guest_user de devise-guests
    user = current_or_guest_user

    @session = Session.new(session_params)
    @session.share_code = generate_share_code
    @session.date = Time.current

    if @session.save
      # Créer le SessionUser avec le rôle de leader
      SessionUser.create!(
        session: @session,
        user: user,
        leader: true
      )

      # Rediriger le leader vers ses préférences d'abord
      redirect_to new_session_preference_path(session_share_code: @session.share_code)
    else
      render :new, status: :unprocessable_entity
    end
  end

  # Redirect from home page join form
  def join_redirect
    share_code = params[:share_code].to_s.strip.upcase
    if share_code.present?
      redirect_to join_session_path(share_code: share_code)
    else
      redirect_to root_path, alert: "Veuillez entrer un code de session"
    end
  end

  # PHASE 2: Page d'entrée pour les invités (avec le share_code)
  def show
    # Cette page permet aux invités d'entrer leur prénom
  end

  # PHASE 4: Dashboard pour voir qui a terminé (accessible aux guests)
  def dashboard
    @session_users = @session.session_users.includes(:user, user: :preference)
    @participants_status = @session_users.map do |su|
      {
        user: su.user,
        leader: su.leader,
        guest_name: su.guest_name,
        preferences_completed: su.user.preference&.present? || false
      }
    end

    # Vérifier si l'utilisateur actuel est le leader
    user = current_or_guest_user
    session_user = @session.session_users.find_by(user: user)
    @is_leader = session_user&.leader? || false
    @is_participant = session_user.present?
  end

  # PHASE 4: Le leader lance la génération (appelé en AJAX)
  def generate_recommendations
    # Vérifier que le current_user est bien le leader
    user = current_or_guest_user
    session_user = @session.session_users.find_by(user: user)

    unless session_user&.leader?
      render json: { error: "Seul le leader peut lancer la génération" }, status: :forbidden
      return
    end

    # Récupérer tous les participants ayant complété leurs préférences
    completed_users = @session.users.joins(:preference).where.not(preferences: { id: nil })

    if completed_users.empty?
      render json: { error: "Aucun participant n'a complété le questionnaire" }, status: :unprocessable_entity
      return
    end

    # Appeler le service pour générer les recommandations
    GenerateRestaurantsService.new(@session).call

    @session.update(completed_at: Time.current)

    # Broadcast pour notifier les invités que les restos sont prêts
    ActionCable.server.broadcast(
      "session_#{@session.share_code}",
      { type: "restaurants_generated" }
    )

    render json: {
      success: true,
      redirect_url: session_restaurants_path(session_share_code: @session.share_code)
    }
  end

  # Supprimer une session (leader uniquement)
  def destroy
    session_user = @session.session_users.find_by(user: current_user)

    unless session_user&.leader?
      redirect_to sessions_path, alert: "Seul le leader peut supprimer cette session"
      return
    end

    @session.destroy
    redirect_to sessions_path, notice: "Session supprimée avec succès", status: :see_other
  end

  private

  def set_session
    @session = Session.find_by(share_code: params[:share_code]) || Session.find(params[:id])
  end

  def session_params
    params.require(:session).permit(:name, :meal_type)
  end

  def generate_share_code
    loop do
      code = SecureRandom.alphanumeric(8).upcase
      break code unless Session.exists?(share_code: code)
    end
  end
end
