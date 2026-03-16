class CreateRoutes < ActiveRecord::Migration[7.1]
  def change
    create_table :routes do |t|
      t.references :user, null: false, foreign_key: true
      t.references :organization, null: false, foreign_key: true

      t.string :start_location, null: false
      t.string :end_location, null: false
      t.text :waypoints

      t.string :recurrence
      t.time :start_time
      t.time :end_time

      t.timestamps
    end
  end
end

