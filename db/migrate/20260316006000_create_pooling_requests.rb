class CreatePoolingRequests < ActiveRecord::Migration[7.1]
  def change
    create_table :pooling_requests do |t|
      t.references :requester, null: false, foreign_key: { to_table: :users }
      t.references :ride_offer, null: false, foreign_key: true
      t.string :status, null: false, default: "pending"
      t.text :message

      t.timestamps
    end

    add_index :pooling_requests,
              %i[requester_id ride_offer_id status],
              name: "index_pooling_requests_on_requester_offer_status"
  end
end

