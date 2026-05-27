@echo off
start "Prod DB" ssh -p 2222 -L 5433:localhost:25432 deploy@161.97.131.7 -N
start "Prod Redis" ssh -p 2222 -L 6380:localhost:26379 deploy@161.97.131.7 -N