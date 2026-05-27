@echo off
start "Dev DB" ssh -p 2222 -L 5433:localhost:15432 deploy@161.97.131.7 -N
start "Dev Redis" ssh -p 2222 -L 6380:localhost:16379 deploy@161.97.131.7 -N