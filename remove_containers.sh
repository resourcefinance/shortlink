#!/bin/bash
docker ps -q --filter "name=guardian-pg" | grep -q . && docker stop guardian-pg && docker rm -fv guardian-pg

