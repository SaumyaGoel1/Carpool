class User < ApplicationRecord
  has_secure_password
  has_secure_token :session_token

  has_many :memberships, dependent: :destroy
  has_many :organizations, through: :memberships
  has_many :routes, dependent: :destroy

  validates :email, presence: true, uniqueness: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP }
end

