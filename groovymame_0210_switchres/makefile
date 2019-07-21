WEB_CC = emcc
NATIVE_CC = g++

CFLAGS = -std=c++11
WEB_CFLAGS = $(CFLAGS) \
  -s FILESYSTEM=0 \
  -s NO_EXIT_RUNTIME=1 \
  -s MODULARIZE=1 \
  -s 'EXPORT_NAME="initModule"' \
  -s "EXTRA_EXPORTED_RUNTIME_METHODS=['ccall']" \
  -s "EXPORTED_FUNCTIONS=['_calc_modelines']" \
	-s DISABLE_EXCEPTION_CATCHING=0 \
	-g4 \
	--closure 1
WASM_CFLAGS = $(WEB_CFLAGS) -s WASM=1
JS_CFLAGS   = $(WEB_CFLAGS) -s WASM=0
NATIVE_CFLAGS = $(CFLAGS) -lm

SOURCE  = src/*.cpp
HEADERS = src/*.h
INPUT = $(SOURCE) $(HEADERS)

OUT = out
WASM_OUT   = $(OUT)/wasm
JS_OUT     = $(OUT)/js
NATIVE_OUT = $(OUT)/native

TARGET_NAME = groovymame_0210_switchres
WASM_TARGET   = $(WASM_OUT)/$(TARGET_NAME).js
JS_TARGET     = $(JS_OUT)/$(TARGET_NAME).js
NATIVE_TARGET = $(NATIVE_OUT)/$(TARGET_NAME)

.PHONY: js
js: $(JS_TARGET)
$(JS_TARGET): $(INPUT)
	mkdir -p $(JS_OUT)
	$(WEB_CC) \
	  $(JS_CFLAGS) \
	  $(SOURCE) \
	  -o $(JS_TARGET)

.PHONY: wasm
wasm: $(WASM_TARGET)
$(WASM_TARGET): $(INPUT)
	mkdir -p $(WASM_OUT)
	$(WEB_CC) \
	  $(WASM_CFLAGS) \
	  $(SOURCE) \
	  -o $(WASM_TARGET)

.PHONY: native
native: $(NATIVE_TARGET)
$(NATIVE_TARGET): $(INPUT)
	mkdir -p $(NATIVE_OUT)
	$(NATIVE_CC) \
	  $(NATIVE_CFLAGS) \
	  $(SOURCE) \
	  -o $(NATIVE_TARGET)

.PHONY: clean-all
.PHONY: clean-wasm
.PHONY: clean-js
.PHONY: clean-native
clean-all: clean-wasm clean-js clean-native
clean-wasm:
	rm -f $(WASM_OUT)/*
clean-js:
	rm -f $(JS_OUT)/*
clean-native:
	rm -f $(NATIVE_OUT)/*