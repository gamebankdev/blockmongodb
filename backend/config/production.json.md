{
  "Config": {
    "gamebank": {
      "server": "ws://127.0.0.1:8090",
      "address_prefix": "TST",
      "chain_id": "18dcf0a285365fc58b71f18b3d3fec954aa0c141c44e4e5cb4cf777b9eab274e"
    },
    "mongo": {
      "url": "mongodb://test:123456@127.0.0.1:27017"
    },
    "http": {
      "port": "5001"
    },
    "block_sync": {
      "block_log_db": "block_log",
      "sync_per_sec": 2000,
      "resync_per_sec": 100
    },
    "contract_sync": {
        "contract_log_db": "contract_log",
        "sync_per_sec": 2000,
        "resync_per_sec": 100
    },
    "watch_wallet": [
    ]
  }
}