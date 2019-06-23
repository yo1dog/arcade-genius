#include <cstdio>
#include <cstdarg>
#include "ext.h"

void osd_printf_error(const char *format, ...)
{
  va_list argptr;
  va_start(argptr, format);
  vfprintf(stderr, format, argptr);
  va_end(argptr);
}
void osd_printf_warning(const char *format, ...)
{
  va_list argptr;
  va_start(argptr, format);
  vfprintf(stderr, format, argptr);
  va_end(argptr);
}
void osd_printf_info(const char *format, ...)
{
  /*
  va_list argptr;
  va_start(argptr, format);
  vfprintf(stderr, format, argptr);
  va_end(argptr);
  */
}
void osd_printf_verbose(const char *format, ...)
{
  /*
  va_list argptr;
  va_start(argptr, format);
  vfprintf(stderr, format, argptr);
  va_end(argptr);
  */
}
void osd_printf_debug(const char *format, ...)
{
  /*
  va_list argptr;
  va_start(argptr, format);
  vfprintf(stderr, format, argptr);
  va_end(argptr);
  */
}
void osd_printf_log(const char *format, ...)
{
  /*
  va_list argptr;
  va_start(argptr, format);
  vfprintf(stderr, format, argptr);
  va_end(argptr);
  */
}

const attoseconds_t ATTOSECONDS_PER_SECOND_SQRT = 1000000000;
const attoseconds_t ATTOSECONDS_PER_SECOND = ATTOSECONDS_PER_SECOND_SQRT * ATTOSECONDS_PER_SECOND_SQRT;
const attoseconds_t HZ_TO_ATTOSECONDS(u32 x) { return attoseconds_t(ATTOSECONDS_PER_SECOND / x); }
const double ATTOSECONDS_TO_HZ(attoseconds_t x) { return double(ATTOSECONDS_PER_SECOND) / double(x); }