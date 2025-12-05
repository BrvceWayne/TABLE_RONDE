class AddNameToSessions < ActiveRecord::Migration[7.1]
  def change
    add_column :sessions, :name, :string
  end
end
