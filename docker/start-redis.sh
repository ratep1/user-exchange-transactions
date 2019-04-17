image=redis:latest
name=redis

docker pull $image
docker stop $name
docker rm $name

docker run --name $name \
  -p 6379:6379 \
  -v $PWD"/redis_storage":"/data" \
  -d $image redis-server --appendonly yes
