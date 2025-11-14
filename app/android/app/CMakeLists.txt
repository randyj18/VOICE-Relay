# Minimal CMakeLists.txt - custom native module setup
cmake_minimum_required(VERSION 3.18.1)
project(appmodules)

# Don't use default-app-setup, we'll create a minimal native setup
# Add our custom library
add_library(appmodules SHARED ${CMAKE_CURRENT_SOURCE_DIR}/OnLoad.cpp)

# Link required libraries
target_link_libraries(appmodules PRIVATE
  android
  log
  jnigraphics
)
