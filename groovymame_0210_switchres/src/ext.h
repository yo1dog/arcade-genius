#ifndef __EXT_H__
#define __EXT_H__

#include <stdint.h>
#include <math.h>
#include <cstdio>
#include <cstring>
#include <cctype>
#include <stdexcept>

void osd_printf_error(const char *format, ...);
void osd_printf_warning(const char *format, ...);
void osd_printf_info(const char *format, ...);
void osd_printf_verbose(const char *format, ...);
void osd_printf_debug(const char *format, ...);
void osd_printf_log(const char *format, ...);


using s8 = int8_t;
using u8 = uint8_t;
using s16 = int16_t;
using u16 = uint16_t;
using s32 = int32_t;
using u32 = uint32_t;
using s64 = int64_t;
using u64 = uint64_t;

typedef s64 attoseconds_t;

#include "switchres.h"

class rectangle
{
public:
  int32_t min_x;  // minimum X, or left coordinate
	int32_t max_x;  // maximum X, or right coordinate (inclusive)
	int32_t min_y;  // minimum Y, or top coordinate
	int32_t max_y;  // maximum Y, or bottom coordinate (inclusive)
  
	// construction/destruction
	rectangle()
    : min_x(0), max_x(0), min_y(0), max_y(0)
  { }
	rectangle(int32_t minx, int32_t maxx, int32_t miny, int32_t maxy)
		: min_x(minx), max_x(maxx), min_y(miny), max_y(maxy)
	{ }

	// getters
	const int32_t left() const { return min_x; }
	const int32_t right() const { return max_x; }
	const int32_t top() const { return min_y; }
	const int32_t bottom() const { return max_y; }

	// compute intersection with another rect
	rectangle &operator&=(const rectangle &src)
	{
		if (src.min_x > min_x) min_x = src.min_x;
		if (src.max_x < max_x) max_x = src.max_x;
		if (src.min_y > min_y) min_y = src.min_y;
		if (src.max_y < max_y) max_y = src.max_y;
		return *this;
	}

	// compute union with another rect
	rectangle &operator|=(const rectangle &src)
	{
		if (src.min_x < min_x) min_x = src.min_x;
		if (src.max_x > max_x) max_x = src.max_x;
		if (src.min_y < min_y) min_y = src.min_y;
		if (src.max_y > max_y) max_y = src.max_y;
		return *this;
	}

	// comparisons
	const bool operator==(const rectangle &rhs) const { return min_x == rhs.min_x && max_x == rhs.max_x && min_y == rhs.min_y && max_y == rhs.max_y; }
	const bool operator!=(const rectangle &rhs) const { return min_x != rhs.min_x || max_x != rhs.max_x || min_y != rhs.min_y || max_y != rhs.max_y; }
	const bool operator>(const rectangle &rhs) const { return min_x < rhs.min_x && min_y < rhs.min_y && max_x > rhs.max_x && max_y > rhs.max_y; }
	const bool operator>=(const rectangle &rhs) const { return min_x <= rhs.min_x && min_y <= rhs.min_y && max_x >= rhs.max_x && max_y >= rhs.max_y; }
	const bool operator<(const rectangle &rhs) const { return min_x >= rhs.min_x || min_y >= rhs.min_y || max_x <= rhs.max_x || max_y <= rhs.max_y; }
	const bool operator<=(const rectangle &rhs) const { return min_x > rhs.min_x || min_y > rhs.min_y || max_x < rhs.max_x || max_y < rhs.max_y; }

	// other helpers
	const bool empty() const { return (min_x > max_x) || (min_y > max_y); }
	const bool contains(int32_t x, int32_t y) const { return (x >= min_x) && (x <= max_x) && (y >= min_y) && (y <= max_y); }
	const bool contains(const rectangle &rect) const { return (min_x <= rect.min_x) && (max_x >= rect.max_x) && (min_y <= rect.min_y) && (max_y >= rect.max_y); }
	const int32_t width() const { return max_x + 1 - min_x; }
	const int32_t height() const { return max_y + 1 - min_y; }
	const int32_t xcenter() const { return (min_x + max_x + 1) / 2; }
	const int32_t ycenter() const { return (min_y + max_y + 1) / 2; }

	// setters
	void set(int32_t minx, int32_t maxx, int32_t miny, int32_t maxy) { min_x = minx; max_x = maxx; min_y = miny; max_y = maxy; }
	void setx(int32_t minx, int32_t maxx) { min_x = minx; max_x = maxx; }
	void sety(int32_t miny, int32_t maxy) { min_y = miny; max_y = maxy; }
	void set_width(int32_t width) { max_x = min_x + width - 1; }
	void set_height(int32_t height) { max_y = min_y + height - 1; }
	void set_origin(int32_t x, int32_t y) { max_x += x - min_x; max_y += y - min_y; min_x = x; min_y = y; }
	void set_size(int32_t width, int32_t height) { set_width(width); set_height(height); }

	// offset helpers
	void offset(int32_t xdelta, int32_t ydelta) { min_x += xdelta; max_x += xdelta; min_y += ydelta; max_y += ydelta; }
	void offsetx(int32_t delta) { min_x += delta; max_x += delta; }
	void offsety(int32_t delta) { min_y += delta; max_y += delta; }
};

#define OPTION_ROTATE               "rotate"
#define OPTION_ROR                  "ror"
#define OPTION_ROL                  "rol"
#define OPTION_AUTOROR              "autoror"
#define OPTION_AUTOROL              "autorol"
#define OPTION_FLIPX                "flipx"
#define OPTION_FLIPY                "flipy"
#define OPTION_KEEPASPECT           "keepaspect"
#define OPTION_UNEVENSTRETCH        "unevenstretch"
#define OPTION_UNEVENSTRETCHX       "unevenstretchx"
#define OPTION_UNEVENSTRETCHY       "unevenstretchy"
#define OPTION_AUTOSTRETCHXY        "autostretchxy"
#define OPTION_INTOVERSCAN          "intoverscan"
#define OPTION_INTSCALEX            "intscalex"
#define OPTION_INTSCALEY            "intscaley"

#define CUSTOM_VIDEO_TIMING_MASK        0x00000ff0
#define CUSTOM_VIDEO_TIMING_SYSTEM      0x00000010
#define CUSTOM_VIDEO_TIMING_XRANDR      0x00000020
#define CUSTOM_VIDEO_TIMING_POWERSTRIP  0x00000040
#define CUSTOM_VIDEO_TIMING_ATI_LEGACY  0x00000080
#define CUSTOM_VIDEO_TIMING_ATI_ADL     0x00000100  

enum
{
	SCALE_FRACTIONAL = 0,                               // compute fractional scaling factors for both axes
	SCALE_FRACTIONAL_X,                                 // compute fractional scaling factor for x-axis, and integer factor for y-axis
	SCALE_FRACTIONAL_Y,                                 // compute fractional scaling factor for y-axis, and integer factor for x-axis
	SCALE_FRACTIONAL_AUTO,                              // automatically compute fractional scaling for x/y-axes based on source native orientation
	SCALE_INTEGER                                       // compute integer scaling factors for both axes, based on target dimensions
};

struct machine_flags
{
	enum
	{
		MASK_ORIENTATION    = 0x00000007,
		MASK_TYPE           = 0x00000038,

		FLIP_X              = 0x00000001,
		FLIP_Y              = 0x00000002,
		SWAP_XY             = 0x00000004,
		ROT0                = 0x00000000,
		ROT90               = FLIP_X | SWAP_XY,
		ROT180              = FLIP_X | FLIP_Y,
		ROT270              = FLIP_Y | SWAP_XY,

		TYPE_ARCADE         = 0x00000008,   // coin-operated machine for public use
		TYPE_CONSOLE        = 0x00000010,   // console system
		TYPE_COMPUTER       = 0x00000018,   // any kind of computer including home computers, minis, calculators, ...
		TYPE_OTHER          = 0x00000038,   // any other emulated system (e.g. clock, satellite receiver, ...)

		NOT_WORKING         = 0x00000040,
		SUPPORTS_SAVE       = 0x00000080,   // system supports save states
		NO_COCKTAIL         = 0x00000100,   // screen flip support is missing
		IS_BIOS_ROOT        = 0x00000200,   // this driver entry is a BIOS root
		REQUIRES_ARTWORK    = 0x00000400,   // requires external artwork for key game elements
		CLICKABLE_ARTWORK   = 0x00000800,   // artwork is clickable and requires mouse cursor
		UNOFFICIAL          = 0x00001000,   // unofficial hardware modification
		NO_SOUND_HW         = 0x00002000,   // system has no sound output
		MECHANICAL          = 0x00004000,   // contains mechanical parts (pinball, redemption games, ...)
		IS_INCOMPLETE       = 0x00008000    // official system with blatantly incomplete hardware/software
	};
};

enum screen_type_enum
{
	SCREEN_TYPE_INVALID = 0,
	SCREEN_TYPE_RASTER,
	SCREEN_TYPE_VECTOR,
	SCREEN_TYPE_LCD,
	SCREEN_TYPE_SVG
};

const attoseconds_t HZ_TO_ATTOSECONDS(u32 x);
const double ATTOSECONDS_TO_HZ(attoseconds_t x);

class screen_device {
  screen_type_enum    m_type;
  attoseconds_t       m_refresh;                  // default refresh period
  rectangle           m_visarea;
  
  public:
    void set_type(screen_type_enum type) { m_type = type; }
    void set_refresh(attoseconds_t rate) { m_refresh = rate; }
    template <typename T> void set_refresh_hz(T &&hz) { set_refresh(HZ_TO_ATTOSECONDS(std::forward<T>(hz))); }
	  void set_visarea(s16 minx, s16 maxx, s16 miny, s16 maxy) { m_visarea.set(minx, maxx, miny, maxy); }
    
    screen_type_enum screen_type() const { return m_type; }
    const rectangle &visible_area() const { return m_visarea; }
    attoseconds_t refresh_attoseconds() const { return m_refresh; }
};

class game_driver {
  public:
    screen_device *m_root_device;
    const char* name;
    u32 flags;
    
    game_driver(const char* p_name, u32 p_flags, screen_device *root_device)
    : name(p_name), flags(p_flags), m_root_device(root_device)
    {};
};

#define MAX_RANGE_LEN 256
class emu_options {
  game_driver *m_system;
  
  public:
    char m_orientation[256] = {'\x00'};
    char m_monitor[256] = {'\x00'};
    char m_ranges[MAX_RANGES][MAX_RANGE_LEN];
    bool m_allow_interlaced;
    bool m_allow_doublescan;
    
    emu_options(game_driver *system)
    : m_system(system)
    {
      memset(m_ranges, 0, sizeof(char) * MAX_RANGES * MAX_RANGE_LEN);
      m_allow_interlaced = true;
      m_allow_doublescan = true;
    }
    const char* system_name() const
    {
      return m_system? m_system->name : "";
    }
    
    // { OPTION_UNEVENSTRETCH ";ues",                       "0",         OPTION_BOOLEAN,    "allow non-integer ratios when scaling to fill output screen/window horizontally or vertically" },
    bool uneven_stretch() const { return true; }
    
    // { OPTION_UNEVENSTRETCHX ";uesx",                     "0",         OPTION_BOOLEAN,    "allow non-integer ratios when scaling to fill output screen/window horizontally"},
    bool uneven_stretch_x() const { return false; }
    
    // { OPTION_UNEVENSTRETCHY ";uesy",                     "0",         OPTION_BOOLEAN,    "allow non-integer ratios when scaling to fill otuput screen/window vertially"},
    bool uneven_stretch_y() const { return false; }
    
    
    // { OPTION_MODELINE_GENERATION ";ml",                  "1",         OPTION_BOOLEAN,    "Automatic generation of modelines based on the specified monitor type" },
    bool modeline_generation() const { return true; }
    
    // { OPTION_MONITOR ";m",                               "generic_15",OPTION_STRING,     "Monitor type, e.g.: generic_15, arcade_15, lcd, custom, etc." },
    const char *monitor() const { return m_monitor; }
    
    // { OPTION_ORIENTATION ";or",                          "horizontal",OPTION_STRING,     "Monitor orientation (horizontal|vertical|rotate|rotate_r|rotate_l)" },
    const char *orientation() const { return m_orientation; }
    
    // { OPTION_CONNECTOR ";cn",                            "auto",      OPTION_STRING,     "[Linux] video card output (VGA-0|VGA-1|DVI-0|DVI-1)" },
    const char *connector() const { return "auto"; }
    
    // { OPTION_INTERLACE ";in",                            "1",         OPTION_BOOLEAN,    "Enable interlaced scanning when necessary" },
    bool interlace() const { return m_allow_interlaced; }
    
    // { OPTION_DOUBLESCAN ";ds",                           "1",         OPTION_BOOLEAN,    "Enable double scanning when necessary (unsupported under Windows)" },
    bool doublescan() const { return m_allow_doublescan; }
    
    // { OPTION_SUPER_WIDTH ";cs",                          "2560",      OPTION_INTEGER,    "Automatically apply -unevenstretchx if resolution width is equal or greater than this value" },
    int super_width() const { return 2560; }
    
    // { OPTION_LOCK_SYSTEM_MODES ";lsm",                   "1",         OPTION_BOOLEAN,    "Lock system (non-custom) video modes, only use modes created by us" },
    bool lock_system_modes() const { return true; }
    
    // { OPTION_LOCK_UNSUPPORTED_MODES ";lum",              "1",         OPTION_BOOLEAN,    "Lock video modes reported as unsupported by your monitor's EDID" },
    bool lock_unsupported_modes() const { return true; }
    
    // { OPTION_REFRESH_DONT_CARE ";rdc",                   "0",         OPTION_BOOLEAN,    "Ignore video mode's refresh reported by OS when checking ranges" },
    bool refresh_dont_care() const { return false; }
    
    // { OPTION_DOTCLOCK_MIN ";dcm",                        "0",         OPTION_STRING,     "Lowest pixel clock supported by video card, in MHz, default is 0" },
    const char *dotclock_min() const { return "0"; }
    
    // { OPTION_SYNC_REFRESH_TOLERANCE ";srt",              "2.0",       OPTION_STRING,     "Maximum refresh difference, in Hz, allowed in order to synchronize" },
    const char *sync_refresh_tolerance() const { return "2.0"; }
    
    // { OPTION_MODELINE ";mode",                           "auto",      OPTION_STRING,     "Use custom defined modeline" },
    const char *modeline() const { return "auto"; }
    
    // { OPTION_LCD_RANGE ";lcd",                           "auto",      OPTION_STRING,     "Add custom LCD range, VfreqMin-VfreqMax, in Hz, e.g.: 55.50-61.00" },
    const char *lcd_range() const { return "auto"; }
    
    // { OPTION_CRT_RANGE0 ";crt0",                         "auto",      OPTION_STRING,     "Add custom CRT range, see documentation for details." },
    const char *crt_range0() const { return strlen(m_ranges[0]) > 0? m_ranges[0] : "auto"; }
    
    // { OPTION_CRT_RANGE1 ";crt1",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range1() const { return strlen(m_ranges[1]) > 0? m_ranges[1] : "auto"; }
    
    // { OPTION_CRT_RANGE2 ";crt2",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range2() const { return strlen(m_ranges[2]) > 0? m_ranges[2] : "auto"; }
    
    // { OPTION_CRT_RANGE3 ";crt3",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range3() const { return strlen(m_ranges[3]) > 0? m_ranges[3] : "auto"; }
    
    // { OPTION_CRT_RANGE4 ";crt4",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range4() const { return strlen(m_ranges[4]) > 0? m_ranges[4] : "auto"; }
    
    // { OPTION_CRT_RANGE5 ";crt5",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range5() const { return strlen(m_ranges[5]) > 0? m_ranges[5] : "auto"; }
    
    // { OPTION_CRT_RANGE6 ";crt6",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range6() const { return strlen(m_ranges[6]) > 0? m_ranges[6] : "auto"; }
    
    // { OPTION_CRT_RANGE7 ";crt7",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range7() const { return strlen(m_ranges[7]) > 0? m_ranges[7] : "auto"; }
    
    // { OPTION_CRT_RANGE8 ";crt8",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range8() const { return strlen(m_ranges[8]) > 0? m_ranges[8] : "auto"; }
    
    // { OPTION_CRT_RANGE9 ";crt9",                         "auto",      OPTION_STRING,     "Add custom CRT range" },
    const char *crt_range9() const { return strlen(m_ranges[9]) > 0? m_ranges[9] : "auto"; }
};

class machine_config {
  screen_device *m_root_device;
  
  public:
    machine_config(const game_driver &gamedrv, emu_options &options)
    {
      m_root_device = gamedrv.m_root_device;
    };
    screen_device &root_device() const { return *m_root_device; }
};


/*
class screen_device_iterator {
  screen_device m_device;
  
  public:
    screen_device_iterator(screen_device device)
    {
      m_device = device;
    };
    screen_device *first() { return &m_device; };
    int count() {return 1;};
};
*/

class render_target {
  int                     m_scale_mode;               // type of scale to apply
  
  public:
    render_target() {
      m_scale_mode = SCALE_FRACTIONAL;
    }
    int orientation() const { return 0; }
	  void set_scale_mode(int scale_mode) { m_scale_mode = scale_mode; }
};
class render_manager {
  public:
    render_target *first_target() const { return NULL; }
};

class running_machine
{
  game_driver *m_system;
  emu_options *m_options;
  render_manager *m_render;
  screen_device *m_root_device;
  
  public:
    running_machine(game_driver *system, emu_options *options, render_manager *render)
    : m_system(system), m_options(options), m_render(render)
    {
      m_root_device = system->m_root_device;
      memset(&switchres, 0, sizeof(struct switchres_manager));
    };
    switchres_manager switchres;
    emu_options &options() const {return *m_options;}
    const game_driver &system() const { return *m_system; }
    render_manager &render() const {return *m_render; }
    screen_device &root_device() const { return *m_root_device; }
};

#include "switchres_proto.h"

#endif // __EXT_H__