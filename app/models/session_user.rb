class SessionUser < ApplicationRecord
  belongs_to :user
  belongs_to :session

  after_create_commit :broadcast_participant_joined

  private

  def broadcast_participant_joined
    ActionCable.server.broadcast("session_#{session.share_code}", { type: "participant_joined" })
  end
end
