class CreateRideParticipants < ActiveRecord::Migration[7.1]
  def change
    create_table :ride_participants do |t|
      t.references :user, null: false, foreign_key: true
      t.references :ride_offer, null: false, foreign_key: true

      t.timestamps
    end

    add_index :ride_participants, %i[user_id ride_offer_id], unique: true
  end
end

