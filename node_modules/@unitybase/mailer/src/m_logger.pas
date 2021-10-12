unit m_logger;

interface

uses
  {$ifdef LINUX}
   BaseUnix, SynCommons,
  {$endif}
  Classes, SysUtils;

procedure addMailLog(const s: string);

implementation

{$ifdef MAILAV_TEST}
var
  MAIL_LOG_FD: cInt;
{$endif}

procedure addMailLog(const s: string);
{$ifdef MAILAV_TEST}
{$ifdef LINUX}
var st: string;
  l: TSsize;
{$endif} {$endif}
begin
  {$ifdef MAILAV_TEST}
  {$ifdef LINUX}
  st := FormatUTF8('%: %'#10, [NowToString, s]);
  l := fpWrite(MAIL_LOG_FD, pointer(st), length(st));
  {$endif} {$endif}
end;

{$ifdef MAILAV_TEST}
{$ifdef LINUX}
initialization
  MAIL_LOG_FD := fpOpen('/tmp/ub_mailerlog.txt', O_APPEND or O_CREAT or O_WRONLY);
finalization
  fpClose(MAIL_LOG_FD);
{$endif LINUX}
{$endif MAILAV_TEST}

end.

