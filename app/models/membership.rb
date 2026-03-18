class Membership < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  validates :user_id, uniqueness: { scope: :organization_id }

  enum :role, { member: "member", admin: "admin" }, default: "member"
end

