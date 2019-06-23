WEB_CC = emcc
NATIVE_CC = g++

CFLAGS = -std=c++11
WEB_CFLAGS = $(CFLAGS) \
  -s WASM=1 \
  -s FILESYSTEM=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s MODULARIZE=1 \
  -s 'EXPORT_NAME="initModule"' \
  -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall','UTF8ToString']" \
  -s "EXPORTED_FUNCTIONS=['_calc_modelines']" \
	-s DISABLE_EXCEPTION_CATCHING=0
DEV_CFLAGS = $(WEB_CFLAGS) -g4
PROD_CFLAGS = $(WEB_CFLAGS) --closure 1
NATIVE_CFLAGS = $(CFLAGS) -lm

SOURCE  = src/*.cpp
HEADERS = src/*.h
INPUT = $(SOURCE) $(HEADERS)

OUT = out
DEV_OUT  = $(OUT)/dev
PROD_OUT = $(OUT)/prod
NATIVE_OUT = $(OUT)/native

TARGET_NAME = groovymame_0210_switchres
DEV_TARGET  = $(DEV_OUT)/$(TARGET_NAME).js
PROD_TARGET = $(PROD_OUT)/$(TARGET_NAME).js
NATIVE_TARGET = $(NATIVE_OUT)/$(TARGET_NAME)

.PHONY: dev
dev: $(DEV_TARGET)
$(DEV_TARGET): $(INPUT)
	mkdir -p $(DEV_OUT)
	$(WEB_CC) \
	  $(DEV_CFLAGS) \
	  $(SOURCE) \
	  -o $(DEV_TARGET)

.PHONY: prod
prod: $(PROD_TARGET)
$(PROD_TARGET): $(INPUT)
	mkdir -p $(PROD_OUT)
	$(WEB_CC) \
	  $(PROD_CFLAGS) \
	  $(SOURCE) \
	  -o $(PROD_TARGET)

.PHONY: native
native: $(NATIVE_TARGET)
$(NATIVE_TARGET): $(INPUT)
	mkdir -p $(NATIVE_OUT)
	$(NATIVE_CC) \
	  $(NATIVE_CFLAGS) \
	  $(SOURCE) \
	  -o $(NATIVE_TARGET)

.PHONY: clean-all
.PHONY: clean-dev
.PHONY: clean-prod
.PHONY: clean-native
clean-all: clean-dev clean-prod clean-native
clean-dev: rm -f $(DEV_OUT)/*
clean-prod: rm -f $(PROD_OUT)/*
clean-native: rm -f $(NATIVE_OUT)/*