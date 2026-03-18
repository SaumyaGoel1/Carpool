class CreateNotifications < ActiveRecord::Migration[7.1]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true

      # "type" is required by the CP. Disable STI in the model.
      t.string :type, null: false

      t.string :reference_type
      t.bigint :reference_id

      t.datetime :read_at

      t.timestamps
    end

    add_index :notifications, %i[user_id read_at]
    add_index :notifications, %i[reference_type reference_id]
  end
end

