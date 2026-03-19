Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Defines the root path route ("/")
  # root "posts#index"

  scope :api do
    post "sign_up", to: "registrations#create"
    post "sign_in", to: "sessions#create"

    resource :profile, only: %i[show update]

    resources :routes
    resources :organizations, only: [] do
      resources :invitations, only: [:create], controller: "organization_invitations"
      get "members", to: "organization_members#index"
    end
    get "organizations/current/members", to: "organization_members#index", defaults: { id: "current" }
    post "invitations/accept", to: "invitations#accept"
    patch "users/:id/deactivate", to: "users#deactivate"
    resources :ride_offers, only: %i[index create update] do
      post "requests", to: "ride_offers#requests_create"
    end

    resources :requests, only: %i[index update] do
      patch "cancel", on: :member
    end

    get "my/requests", to: "requests#my_index"

    resources :notifications, only: [:index] do
      member do
        patch :mark_read
      end
      collection do
        patch :mark_all_read
      end
    end
  end
end
