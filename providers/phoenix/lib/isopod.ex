defmodule Isopod.Application do
  use Application
  def start(_type, _args) do
    Supervisor.start_link([
      {Phoenix.PubSub, name: Isopod.PubSub}, Isopod.Endpoint
    ], strategy: :one_for_one, name: Isopod.Supervisor)
  end
end

defmodule Isopod.CORS do
  import Plug.Conn
  def init(opts), do: opts
  def call(conn, _opts) do
    origin = Application.fetch_env!(:isopod, :host_origin)
    conn = conn
      |> put_resp_header("access-control-allow-origin", origin)
      |> put_resp_header("access-control-allow-credentials", "true")
      |> put_resp_header("vary", "origin")
    if conn.method == "OPTIONS", do: conn |> send_resp(204, "") |> halt(), else: conn
  end
end

defmodule Isopod.CounterLive do
  use Phoenix.LiveView, layout: false
  require Logger
  def mount(_params, _session, socket) do
    if connected?(socket), do: :timer.send_interval(1000, self(), :tick)
    {:ok, assign(socket, count: 0, time: DateTime.utc_now() |> DateTime.to_iso8601())}
  end
  def handle_event("increment", _, socket) do
    socket = update(socket, :count, &(&1 + 1))
    Logger.info("counter.increment provider=phoenix instance=#{socket.id} count=#{socket.assigns.count}")
    {:noreply, socket}
  end
  def handle_info(:tick, socket), do: {:noreply, assign(socket, :time, DateTime.utc_now() |> DateTime.to_iso8601())}
  def render(assigns) do
    ~H"""
    <article>
      <h3>Phoenix LiveView</h3><p>Elixir 프로세스가 상태를 소유하고 화면의 차이를 보냅니다.</p>
      <output aria-label="카운트">{@count}</output>
      <button type="button" phx-click="increment">+1</button>
      <footer>서버 시각 <time>{@time}</time></footer>
    </article>
    """
  end
end

defmodule Isopod.Layouts do
  use Phoenix.Component
  def root(assigns) do
    ~H"""
    <!doctype html>
    <html lang="ko"><head><meta name="csrf-token" content={Plug.CSRFProtection.get_csrf_token()} /></head>
      <body>{@inner_content}</body>
    </html>
    """
  end
end

defmodule Isopod.ErrorHTML do
  def render(template, _), do: Phoenix.Controller.status_message_from_template(template)
end

defmodule Isopod.IslandController do
  use Phoenix.Controller, formats: [:html], layouts: []
  def show(conn, _params), do: Phoenix.LiveView.Controller.live_render(conn, Isopod.CounterLive)
end

defmodule Isopod.Router do
  use Phoenix.Router
  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :protect_from_forgery
    plug :put_root_layout, html: {Isopod.Layouts, :root}
  end
  scope "/" do
    pipe_through :browser
    get "/island", Isopod.IslandController, :show
  end
end

defmodule Isopod.Endpoint do
  use Phoenix.Endpoint, otp_app: :isopod
  @session_options [store: :cookie, key: "_isopod_live", signing_salt: "isopod-session", same_site: "Lax"]
  socket "/live", Phoenix.LiveView.Socket, websocket: [connect_info: [session: @session_options]], longpoll: false
  plug Isopod.CORS
  plug Plug.Static, at: "/", from: :isopod, only: ["remote.js", "health"]
  plug Plug.Session, @session_options
  plug Isopod.Router
end
