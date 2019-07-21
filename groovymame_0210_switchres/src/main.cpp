#include "ext.h"
#include "switchres.h"
#include "switchres_proto.h"
#include "../lib/json.hpp"
#include <iostream>

using json = nlohmann::json;

typedef struct t_machine_output {
  const char* machine_name;
  json output;
} t_machine_output;

template <typename T>
T get_json_or_0(json *j) {
  if (j->is_null()) {
    return 0;
  }
  return j->get<T>();
}

std::string copy_json_str(std::string str) {
  // not sure why this is necessary
  return std::string(str.c_str());
}

t_machine_output calc_modeline(json config, json machine) {
  t_machine_output machine_output;
  std::string machine_name;
  json machine_display;
  
  try {
    machine_name = copy_json_str(machine["name"].get<std::string>());
    machine_display = machine["display"];
    
    if (machine_display.is_null()) {
      machine_display = machine["displays"].get<std::vector<json>>().front();
    }
  } catch(const std::exception& err) {
    fprintf(stderr, "err: %s\n", err.what());
    json err_json = {
      {"err", err.what()}
    };
    machine_output.machine_name = machine_name.c_str();
    machine_output.output = err_json;
    return machine_output;
  }
  
  try {
    screen_device screen = screen_device();
    
    const char *screen_type_str = copy_json_str(machine_display["type"].get<std::string>()).c_str();
    screen_type_enum screen_type;
    if (!strcmp(screen_type_str, "raster")) {
      screen_type = SCREEN_TYPE_RASTER;
    }
    else if (!strcmp(screen_type_str, "vector")) {
      screen_type = SCREEN_TYPE_VECTOR;
    }
    else if (!strcmp(screen_type_str, "lcd")) {
      screen_type = SCREEN_TYPE_LCD;
    }
    else if (!strcmp(screen_type_str, "svg")) {
      screen_type = SCREEN_TYPE_SVG;
    }
    else {
      screen_type = SCREEN_TYPE_INVALID;
    }
    
    screen.set_type(screen_type);
    screen.set_refresh_hz(machine_display["refresh"].get<double>());
    
    if (screen.screen_type() != SCREEN_TYPE_VECTOR) {
      screen.set_visarea(
        0,
        machine_display["width"].get<s32>()-1,
        0,
        machine_display["height"].get<s32>()-1
      );
    }
    
    /*
    screen.set_raw(
      machine_display["pixclock"].get<u32>(),
      machine_display["htotal"  ].get<u16>(),
      machine_display["hbend"   ].get<u16>(),
      machine_display["hbstart" ].get<u16>(),
      machine_display["vtotal"  ].get<u16>(),
      machine_display["vbend"   ].get<u16>(),
      machine_display["vbstart" ].get<u16>()
    );
    */
    
    int machine_display_rotate = machine_display["rotate"].get<int>();
    bool machine_display_flipx  = machine_display["flipx"].get<bool>();
    
    game_driver system = game_driver(
      machine_name.c_str(),
      (
        machine_flags::TYPE_ARCADE | (
          (
            machine_display_rotate ==  90? machine_flags::ROT90  :
            machine_display_rotate == 180? machine_flags::ROT180 :
            machine_display_rotate == 270? machine_flags::ROT180 :
            0
          )
          ^ (machine_display_flipx? machine_flags::FLIP_X : 0)
        )
      ),
      &screen
    );
    
    emu_options options = emu_options(&system);
    
    json monitor_orientation_json = config["orientation"];
    if (!monitor_orientation_json.is_null()) {
      options.m_orientation = copy_json_str(monitor_orientation_json.get<std::string>()).c_str();
    }
    
    json monitor_preset_json = config["preset"];
    if (!monitor_preset_json.is_null()) {
      options.m_monitor = copy_json_str(monitor_preset_json.get<std::string>()).c_str();
    }
    
    json monitor_ranges_json = config["ranges"];
    if (!monitor_ranges_json.is_null()) {
      std::vector<std::string> monitor_ranges_str = monitor_ranges_json.get<std::vector<std::string>>();
      
      int i;
      std::vector<std::string>::iterator it;
      for (
        i = 0,    it = monitor_ranges_str.begin();
        i < 10 && it != monitor_ranges_str.end();
        ++i,      ++it
      ) {
        it->resize(MAX_RANGE_LEN-1);
        strcpy(options.m_ranges[i], it->c_str());
      }
    }
    
    json allow_interlaced_json = config["allowInterlaced"];
    if (!allow_interlaced_json.is_null()) {
      options.m_allow_interlaced = allow_interlaced_json.get<bool>();
    }
    
    json allow_doublescan_json = config["allowDoublescan"];
    if (!allow_doublescan_json.is_null()) {
      options.m_allow_doublescan = allow_doublescan_json.get<bool>();
    }
    
    
    render_manager render = render_manager(); 
    
    running_machine machine = running_machine(&system, &options, &render);
    machine.switchres.cs.monitor_aspect = STANDARD_CRT_ASPECT;
    
    switchres_get_game_info(machine);
    switchres_init(machine);
    
    modeline *mode = &machine.switchres.user_mode;
    mode->width = mode->height = 1;
    mode->refresh = 60;
    mode->vfreq = mode->refresh;
    mode->hactive = mode->vactive = 1;
    mode->type = XYV_EDITABLE | XRANDR_TIMING | (machine.switchres.cs.desktop_rotated? MODE_ROTATED : MODE_OK);
    
    char modeline_txt[256]={'\x00'};
    osd_printf_verbose("SwitchRes: user modeline %s\n", modeline_print(mode, modeline_txt, MS_FULL));
    
    switchres_get_video_mode(machine);
    
    
    json output;
    modeline *best_mode = &machine.switchres.best_mode;
    
    if (best_mode->result.weight & R_OUT_OF_RANGE) {
      output = {
        {"inRange", false},
        {"description", "OUT OF RANGE"},
        {"details", "OUT OF RANGE"},
      };
    }
    else {
      char description[256] = {'\x00'};
      sprintf(description, "%s (%dx%d@%.6f)->(%dx%d@%.6f)", machine.switchres.game.orientation?"vertical":"horizontal",
        machine.switchres.game.width, machine.switchres.game.height, machine.switchres.game.refresh, best_mode->hactive, best_mode->vactive, best_mode->vfreq
      );
      
      char details[256] = {'\x00'};
      modeline_result(best_mode, details);
    
      output = {
        {"inRange", true},
        {"description", description},
        {"details", details},
        {"vfreqOff",   best_mode->result.weight & R_V_FREQ_OFF ? true : false},
        {"resStretch", best_mode->result.weight & R_RES_STRETCH? true : false},
        {"weight",     best_mode->result.weight },
        {"xScale",     best_mode->result.x_scale},
        {"yScale",     best_mode->result.y_scale},
        {"vScale",     best_mode->result.v_scale},
        {"xDiff",      best_mode->result.x_diff },
        {"yDiff",      best_mode->result.y_diff },
        {"vDiff",      best_mode->result.v_diff },
        {"xRatio",     best_mode->result.x_ratio},
        {"yRatio",     best_mode->result.y_ratio},
        {"vRatio",     best_mode->result.v_ratio},
        {"rotated",    best_mode->result.rotated},
        {"modeline", {
          {"pclock",     best_mode->pclock    },
          {"hactive",    best_mode->hactive   },
          {"hbegin",     best_mode->hbegin    },
          {"hend",       best_mode->hend      },
          {"htotal",     best_mode->htotal    },
          {"vactive",    best_mode->vactive   },
          {"vbegin",     best_mode->vbegin    },
          {"vend",       best_mode->vend      },
          {"vtotal",     best_mode->vtotal    },
          {"interlace",  best_mode->interlace },
          {"doublescan", best_mode->doublescan},
          {"hsync",      best_mode->hsync     },
          {"vsync",      best_mode->vsync     },
          //
          {"vfreq",      best_mode->vfreq     },
          {"hfreq",      best_mode->hfreq     },
          //
          {"width",      best_mode->width     },
          {"height",     best_mode->height    },
          {"refresh",    best_mode->refresh   },
          //
          {"type",       best_mode->type      },
          {"range",      best_mode->range     }
        }},
      };
    }
    
    machine_output.machine_name = machine_name.c_str();
    machine_output.output = output;
    return machine_output;
  }
  catch(const std::exception& err) {
    fprintf(stderr, "err: %s\n", err.what());
    json err_json = {
      {"err", err.what()}
    };
    machine_output.machine_name = machine_name.c_str();
    machine_output.output = err_json;
    return machine_output;
  }
}


#ifdef __cplusplus
extern "C" {
#endif

const char *calc_modelines(const char *input_json_str) {
  try {
    json input = json::parse(input_json_str);
    json config = input["config"];
    std::vector<json> machines = input["machines"].get<std::vector<json>>();
    
    json output = json::object();
    for (std::vector<json>::iterator it = machines.begin(); it != machines.end(); ++it) {
      t_machine_output machine_output = calc_modeline(config, *it);
      output[machine_output.machine_name] = machine_output.output;
    }
    
    return output.dump().c_str();
    
  } catch(const std::exception& err) {
    fprintf(stderr, "err: %s\n", err.what());
    json err_json = {
      {"err", err.what()}
    };
    return err_json.dump().c_str();
  }
}

#ifdef __cplusplus
}
#endif



int main(int argc, const char **argv) {
  const char *input_json_str = argc > 1? argv[1] : "";
  
  const char *output_json_str = calc_modelines(input_json_str);
  std::cout << output_json_str << "\n";
  
  return 0;
}