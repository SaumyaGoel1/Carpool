# frozen_string_literal: true

class CreateRoutes < ActiveRecord::Migration[8.0]
  def change
    create_table :routes do |t|
      t.references :user, null: false, foreign_key: true

      t.string :start_address
      t.decimal :start_lat, precision: 10, scale: 7
      t.decimal :start_lng, precision: 10, scale: 7
      t.string :end_address
      t.decimal :end_lat, precision: 10, scale: 7
      t.decimal :end_lng, precision: 10, scale: 7
      t.json :waypoints, default: []

      t.string :recurrence
      t.time :departure_time
      t.time :arrival_time

      t.timestamps
    end
  end
end
