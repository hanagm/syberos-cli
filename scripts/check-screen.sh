#!/bin/bash

isScreenExist(){
  if command -v screen > /dev/null ;then
    echo "command screen is found"
    return 1
  fi
  echo "command screen not found"
  return 0
}

isScreenExist
if [ $? -eq 0 ];then
  echo "Install screen..."
  sudo apt-get install -y screen
fi
