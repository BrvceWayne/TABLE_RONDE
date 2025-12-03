class AddLocationToPreferences < ActiveRecord::Migration[7.1]
  def change
    add_column :preferences, :latitude, :float
    add_column :preferences, :longitude, :float
    add_column :preferences, :address, :string
  end
end
