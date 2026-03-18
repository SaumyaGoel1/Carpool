class User < ApplicationRecord
  has_secure_password
  has_secure_token :session_token

  has_many :memberships, dependent: :destroy
  has_many :organizations, through: :memberships
  has_many :routes, dependent: :destroy
  has_many :pooling_requests, foreign_key: :requester_id, dependent: :destroy
  has_many :notifications, dependent: :destroy

  validates :email, presence: true, uniqueness: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP }

  def admin_of?(organization)
    return false unless organization

    memberships.exists?(organization_id: organization.id, role: "admin")
  end
end

