import Config
config :isopod, Isopod.Endpoint,
  adapter: Bandit.PhoenixAdapter,
  pubsub_server: Isopod.PubSub,
  live_view: [signing_salt: "isopod-live"],
  render_errors: [formats: [html: Isopod.ErrorHTML], layout: false]
config :phoenix, :json_library, Jason
config :logger, level: :info
