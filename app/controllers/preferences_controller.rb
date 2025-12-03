class PreferencesController < ApplicationController
  skip_before_action :authenticate_user!, only: [:new, :create, :update]
  before_action :find_session
  before_action :set_preference, only: [:edit, :update]

  # PHASE 3: Page du questionnaire
  def new
    user = current_or_guest_user
    @preference = user.preference || user.build_preference
  end

  # PHASE 3: Création des préférences (première sauvegarde)
  def create
    user = current_or_guest_user
    @preference = user.preference || user.build_preference

    @preference.assign_attributes(preference_params)
    merge_other_cuisine

    if @preference.save
      # Si c'est un guest user, proposer de créer un compte
      if user.guest?
        redirect_to @session, notice: "Vos préférences ont été enregistrées. Créez un compte pour les sauvegarder !"
      else
        redirect_to @session, notice: "Vos préférences ont été enregistrées"
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  # PHASE 3: Modification des préférences
  def edit
  end

  def update
    @preference.assign_attributes(preference_params)
    merge_other_cuisine

    if @preference.save
      redirect_to @session, notice: "Vos préférences ont été mises à jour"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def find_session
    @session = Session.find_by!(share_code: params[:session_share_code])
  end

  def set_preference
    user = current_or_guest_user
    @preference = user.preference
  end

  def preference_params
    params.require(:preference).permit(
      :max_distance,
      :budget_min,
      :budget_max,
      :ambiance,
      :special_requests,
      :other_cuisine,
      dietary_restrictions: [],
      cuisine_types: []
    )
  end

  def merge_other_cuisine
    other = params.dig(:preference, :other_cuisine)
    return if other.blank?

    # Sépare les cuisines par virgule et nettoie
    custom_cuisines = other.split(",").map(&:strip).reject(&:blank?)
    return if custom_cuisines.empty?

    # Ajoute les cuisines personnalisées au tableau existant
    current = @preference.cuisine_types || []
    @preference.cuisine_types = (current + custom_cuisines).uniq
  end
end
