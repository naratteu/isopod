import Config
origin = System.get_env("HOST_ORIGIN", "http://localhost:4321")
origins = [origin, "https://naratteu.github.io"]
config :isopod, host_origin: origin
config :isopod, Isopod.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PORT", "4000"))],
  url: [host: "localhost", port: 5107],
  check_origin: origins,
  secret_key_base: System.fetch_env!("SECRET_KEY_BASE"),
  server: true
