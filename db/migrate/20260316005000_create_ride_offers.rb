class CreateRideOffers < ActiveRecord::Migration[7.1]
  def change
    create_table :ride_offers do |t|
      t.references :route, null: false, foreign_key: true
      t.integer :seats_available, null: false, default: 1
      t.boolean :active, null: false, default: true

      t.timestamps
    end
  end
end

