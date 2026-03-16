# frozen_string_literal: true

module JwtAuthenticatable
  extend ActiveSupport::Concern

  JWT_EXPIRY = 7.days

  class_methods do
    def jwt_secret
      ENV.fetch("JWT_SECRET", Rails.application.secret_key_base)
    end
  end

  def encode_token(user_id)
    payload = { sub: user_id, exp: JWT_EXPIRY.from_now.to_i }
    JWT.encode(payload, self.class.jwt_secret)
  end

  def decode_token(token)
    body = JWT.decode(token, self.class.jwt_secret).first
    body.with_indifferent_access
  rescue JWT::DecodeError
    nil
  end

  def current_user_from_token
    token = request.authorization&.sub(/\ABearer\s+/i, "")
    return nil if token.blank?

    payload = decode_token(token)
    User.find_by(id: payload&.dig("sub")) if payload
  end
end
