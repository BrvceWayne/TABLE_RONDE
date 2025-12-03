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
end
