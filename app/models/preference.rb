class Preference < ApplicationRecord
  belongs_to :user

  # Sérialisation des champs arrays stockés en text
  serialize :cuisine_types, coder: JSON
  serialize :dietary_restrictions, coder: JSON

  # S'assurer que les arrays sont initialisés
  after_initialize do
    self.cuisine_types ||= []
    self.dietary_restrictions ||= []
  end

  after_save_commit :broadcast_preferences_updated

  private

  def broadcast_preferences_updated
    user.session_users.each do |session_user|
      ActionCable.server.broadcast("session_#{session_user.session.share_code}", { type: "preferences_updated" })
    end
  end
end
