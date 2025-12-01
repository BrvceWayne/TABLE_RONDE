class Session < ApplicationRecord
  has_many :session_users, dependent: :destroy
  has_many :users, through: :session_users

  has_many :restaurants, dependent: :destroy
end
