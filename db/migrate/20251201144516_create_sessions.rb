class CreateSessions < ActiveRecord::Migration[7.1]
  def change
    create_table :sessions do |t|
      t.string :share_code
      t.string :meal_type
      t.datetime :date
      t.datetime :completed_at

      t.timestamps
    end
  end
end
