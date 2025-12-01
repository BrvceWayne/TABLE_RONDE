class CreateRestaurants < ActiveRecord::Migration[7.1]
  def change
    create_table :restaurants do |t|
      t.integer :rank
      t.string :google_place_id
      t.string :name
      t.string :address
      t.float :latitude
      t.float :longitude
      t.string :phone
      t.text :ai_explanation
      t.string :reservation_url
      t.references :session, null: false, foreign_key: true

      t.timestamps
    end
  end
end
