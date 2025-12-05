class AddGuestNameToSessionUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :session_users, :guest_name, :string
  end
end
