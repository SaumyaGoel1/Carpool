# frozen_string_literal: true

class AddProfileToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :name, :string
    add_column :users, :phone, :string
    add_column :users, :vehicle_make, :string
    add_column :users, :vehicle_model, :string
    add_column :users, :vehicle_capacity, :string
  end
end
