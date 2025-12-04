class AddDetailsToRestaurants < ActiveRecord::Migration[7.1]
  def change
    add_column :restaurants, :rating, :float
    add_column :restaurants, :price_level, :integer
    add_column :restaurants, :cuisine_type, :string
    add_column :restaurants, :photo_url, :string
    add_column :restaurants, :website, :string
    add_column :restaurants, :opening_hours, :text
    add_column :restaurants, :is_open_now, :boolean
  end
end
