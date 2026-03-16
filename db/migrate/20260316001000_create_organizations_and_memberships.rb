class CreateOrganizationsAndMemberships < ActiveRecord::Migration[7.1]
  def change
    create_table :organizations do |t|
      t.string :name, null: false

      t.timestamps
    end

    add_index :organizations, :name, unique: true

    create_table :memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :organization, null: false, foreign_key: true

      t.timestamps
    end

    add_index :memberships, %i[user_id organization_id], unique: true
  end
end

