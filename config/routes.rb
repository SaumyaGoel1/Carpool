Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    post "sign_up", to: "auth#sign_up"
    post "sign_in", to: "auth#sign_in"
    get "me", to: "me#show"
    get "profile", to: "profiles#show"
    patch "profile", to: "profiles#update"
    get "organization", to: "organizations#show"
    patch "organization", to: "organizations#update"
    resources :routes, only: [:index, :show, :create, :update, :destroy]
    get "rides/offers", to: "rides#offers"
    namespace :organization do
      get "members", to: "members#index"
    end
  end
end
