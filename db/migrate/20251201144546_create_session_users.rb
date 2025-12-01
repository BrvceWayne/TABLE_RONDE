class CreateSessionUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :session_users do |t|
      t.references :user, null: false, foreign_key: true
      t.references :session, null: false, foreign_key: true
      t.boolean :leader

      t.timestamps
    end
  end
end
