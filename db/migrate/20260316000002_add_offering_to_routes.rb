# frozen_string_literal: true

class AddOfferingToRoutes < ActiveRecord::Migration[8.0]
  def change
    add_column :routes, :offering, :boolean, null: false, default: false
    add_column :routes, :seats_available, :integer, null: false, default: 0
  end
end
