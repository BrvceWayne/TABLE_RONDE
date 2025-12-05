class PreferencesController < ApplicationController
  skip_before_action :authenticate_user!, only: [:new, :create, :update]
  before_action :find_session
  before_action :set_preference, only: [:edit, :update]

  def new
    user = current_or_guest_user
    @preference = user.preference || user.build_preference
  end

  def create
    user = current_or_guest_user
    @preference = user.preference || user.build_preference

    @preference.assign_attributes(preference_params)
    merge_other_cuisine

    if @preference.save
      if user.guest?
        redirect_to dashboard_session_path(share_code: @session.share_code), notice: "Vos préférences ont été enregistrées. Créez un compte pour les sauvegarder !"
      else
        redirect_to dashboard_session_path(share_code: @session.share_code), notice: "Vos préférences ont été enregistrées"
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @preference.update(preference_params)
      redirect_to dashboard_session_path(share_code: @session.share_code), notice: "Vos préférences ont été mises à jour"
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
    permitted = params.require(:preference).permit(
      :max_distance,
      :budget_min,
      :budget_max,
      :budget_level,
      :ambiance,
      :special_requests,
      :latitude,
      :longitude,
      :address,
      dietary_restrictions: [],
      cuisine_types: [],
      ambiance_tags: []
    )

    # max_distance est déjà en mètres depuis les pills (500, 1000, 2000, etc.)
    # Donc pas besoin de conversion

    # Si ambiance_tags est fourni, on le convertit en string pour ambiance
    if permitted[:ambiance_tags].present?
      permitted[:ambiance] = permitted[:ambiance_tags].reject(&:blank?).join(', ')
    end
    permitted.delete(:ambiance_tags)
    permitted.delete(:budget_level) # On ne stocke pas budget_level, seulement min/max

    permitted
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
