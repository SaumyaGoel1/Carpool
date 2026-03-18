class CreateInvitations < ActiveRecord::Migration[7.1]
  def change
    create_table :invitations do |t|
      t.string :email, null: false
      t.references :organization, null: false, foreign_key: true

      # Store only a digest of the token (return raw token only once on creation)
      t.string :token_digest, null: false

      t.string :status, null: false, default: "pending"
      t.string :role

      t.datetime :accepted_at

      t.timestamps
    end

    add_index :invitations, :token_digest, unique: true
    add_index :invitations, %i[organization_id email status]
  end
end

