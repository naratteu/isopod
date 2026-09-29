defmodule Isopod.MixProject do
  use Mix.Project
  def project do
    [app: :isopod, version: "0.1.0", elixir: "~> 1.18", deps: deps()]
  end
  def application, do: [mod: {Isopod.Application, []}, extra_applications: [:logger, :crypto]]
  defp deps do
    [{:phoenix, "~> 1.8.15"}, {:phoenix_live_view, "~> 1.2.12"}, {:bandit, "~> 1.8"}, {:jason, "~> 1.4"}]
  end
end
