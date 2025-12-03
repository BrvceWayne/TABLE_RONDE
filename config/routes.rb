Rails.application.routes.draw do
  get "webmanifest"    => "pwa#manifest"
  get "service-worker" => "pwa#service_worker"

  devise_for :users
  root to: "pages#home"

  # PHASE 1 & 2: Création et accès aux sessions
  resources :sessions, only: [:new, :create], param: :share_code do
    member do
      get :dashboard       # PHASE 4: Dashboard du leader
      post :generate_recommendations  # PHASE 4: Lancer la génération
    end

    # PHASE 3: Questionnaire de préférences
    resources :preferences, only: [:new, :create, :edit, :update]

    # PHASE 5 & 6: Recommandations de restaurants
    resources :restaurants, only: [:index, :show] do
      collection do
        post :regenerate  # PHASE 6: Demander de nouvelles recommandations
      end
    end
  end

  # PHASE 2: Rejoindre une session via le share_code
  get '/join/:share_code', to: 'sessions#show', as: :join_session
  post '/join/:share_code', to: 'session_users#create', as: :join_session_user

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
