class SessionChannel < ApplicationCable::Channel
  def subscribed
    session = Session.find_by(share_code: params[:share_code])
    if session
      stream_from "session_#{session.share_code}"
    else
      reject
    end
  end

  def unsubscribed
    # Cleanup si nécessaire
  end
end
