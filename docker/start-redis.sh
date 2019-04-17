image=redis
name=backend_redis

docker stop $name
docker rm $name

docker run --name $name \
  -p 6379:6379 \
  -v $PWD"/redis_storage":"/data" \
  -d $image redis-server --appendonly yes
