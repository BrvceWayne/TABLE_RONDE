class SessionUsersController < ApplicationController
  skip_before_action :authenticate_user!, only: [:create]
  before_action :find_session, only: [:create]

  # PHASE 2: Bob et Charles rejoignent la session
  def create
    # Utilise current_or_guest_user de devise-guests
    user = current_or_guest_user

    # Vérifier si l'utilisateur fait déjà partie de la session
    if @session.session_users.exists?(user: user)
      redirect_to session_preferences_path(@session), notice: "Vous êtes déjà dans cette session"
      return
    end

    # Créer le SessionUser (participant, pas leader)
    session_user = SessionUser.new(
      session: @session,
      user: user,
      leader: false
    )

    if session_user.save
      redirect_to session_preferences_path(@session)
    else
      redirect_to session_path(@session.share_code), alert: "Impossible de rejoindre la session"
    end
  end

  private

  def find_session
    @session = Session.find_by!(share_code: params[:share_code])
  rescue ActiveRecord::RecordNotFound
    redirect_to root_path, alert: "Session introuvable"
  end
end
