@echo off
start "Dev DB" ssh -p 2222 -L 5433:localhost:15432 deploy@62.171.185.91 -N
start "Dev Redis" ssh -p 2222 -L 6380:localhost:16379 deploy@62.171.185.91 -N