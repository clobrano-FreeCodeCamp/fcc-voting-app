# Dockerizing MongoDB: Dockerfile for building MongoDB images
# Based on ubuntu:latest, installs MongoDB following the instructions from:
# http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/

## Usage
## Basic way
## Usage: docker run --name <name for container> -d <user-name>/<repository>
#$ docker run -p 27017:27017 --name mongo_instance_001 -d my/repo
#
## Dockerized MongoDB, lean and mean!
## Usage: docker run --name <name for container> -d <user-name>/<repository> --noprealloc --smallfiles
#$ docker run -p 27017:27017 --name mongo_instance_001 -d my/repo --smallfiles
#
## Checking out the logs of a MongoDB container
## Usage: docker logs <name for container>
#$ docker logs mongo_instance_001
#
## Playing with MongoDB
## Usage: mongo --port <port you get from `docker ps`>
#$ mongo --port 27017
#
## If using docker-machine
## Usage: mongo --port <port you get from `docker ps`>  --host <ip address from `docker-machine ip VM_NAME`>
#$ mongo --port 27017 --host 192.168.59.103


# upd:2015-11-28 follow this link without using a dockerfile https://hub.docker.com/_/mongo/
from ubuntu:latest
maintainer carlo lobrano <c.lobrano@gmail.com>

# Installation:
# Import MongoDB public GPG key AND create a MongoDB list file
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
RUN echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-3.0.list
# Update apt-get sources AND install MongoDB
RUN apt-get update && apt-get install -y mongodb-org
RUN mkdir -p /data/db
# Expose port 27017 from the container to the host
EXPOSE 27017

# Set usr/bin/mongod as the dockerized entry-point application
ENTRYPOINT ["/usr/bin/mongod"]
