import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = {
    shareCode: String
  }

  connect() {
    this.channel = createConsumer().subscriptions.create(
      { channel: "SessionChannel", share_code: this.shareCodeValue },
      {
        received: (data) => {
          this.handleMessage(data)
        }
      }
    )
  }

  disconnect() {
    if (this.channel) {
      this.channel.unsubscribe()
    }
  }

  handleMessage(data) {
    if (data.type === "participant_joined" || data.type === "preferences_updated" || data.type === "restaurants_generated") {
      Turbo.visit(window.location.href, { action: "replace" })
    }
  }
}
