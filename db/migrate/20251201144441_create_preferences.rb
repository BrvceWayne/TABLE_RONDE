class CreatePreferences < ActiveRecord::Migration[7.1]
  def change
    create_table :preferences do |t|
      t.text :dietary_restrictions
      t.text :cuisine_types
      t.integer :budget_min
      t.integer :budget_max
      t.integer :max_distance
      t.string :ambiance
      t.text :special_requests
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
