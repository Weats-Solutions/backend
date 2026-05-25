@echo off
start "Dev DB" ssh -p 2222 -L 5433:weats-prod-coredb-slltxz:5432 deploy@161.97.131.7 -N
start "Dev Redis" ssh -p 2222 -L 6380:weats-dev-redis-rnuw1a:6379 deploy@161.97.131.7 -N