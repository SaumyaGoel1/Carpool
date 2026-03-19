class AddSettingsToOrganizations < ActiveRecord::Migration[7.1]
  def change
    add_column :organizations, :max_seats_per_offer, :integer
    add_column :organizations, :visibility, :string
  end
end
