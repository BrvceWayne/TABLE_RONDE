class User < ApplicationRecord
  has_one :preferences, dependent: :destroy
  has_many :session_users, dependent: :destroy
  has_many :sessions, through: :session_users
 
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable
end
