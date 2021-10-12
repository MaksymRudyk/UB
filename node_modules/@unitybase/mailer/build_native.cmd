rem -Scgi <------>- Support operators like C; Enable LABEL and GOTO(default for -MDelphi; Inlining
rem -Cg PIC code >- for Linux library only (slowed code for program)
rem -Ci <><------>- IO checking
rem -O2 <><------>- optimization level
rem -g -gl -gw2 -Xg- Generate debug information; Use line info unit (show more info with backtraces); DWARFv2 debug info; debug info in separate file
rem -k'-rpath=$ORIGIN' - link to a library in the same folder as program
rem -veiq -vw-n-h - verbose(errors, info, message numbers) no warnings, no notes, no hints
rem -B <-><------>- build all
rem -Se10 <------>- halts after 10 error.
rem to switch to x64MM -dFPC_SYNCMEM should be removed and -dFPC_X64MM -dFPCMM_SERVER added

SET TARGET=win64
SET ARCH=x86_64

md .\bin\%ARCH%

if [%UB_SRC%]==[] (
  SET UB_SRC=../../../ub-server
)
if [%LAZ_DIR%]==[] (
  SET LAZ_DIR==C:/lazarus
)

md .\.dcu\fpc-%TARGET%
%LAZ_DIR%/fpc/3.2.0/bin/%ARCH%-%TARGET%/fpc.exe -MDelphi -Sci -Ci -O2 -k-Lbin/fpc-linux -Twin64 -Px86_64 ^
  -veiq -vw-n-h- ^
  -Fi.dcu/fpc-win64 -Fi%UB_SRC%/libs/Synopse -Fi%UB_SRC%/libs/Synopse/SQLite3 -Fi%UB_SRC%/libs/Synopse/SyNode -Fi%UB_SRC%/libs/synapse40/source/lib ^
  -Fu%UB_SRC%/libs/Synopse -Fu%UB_SRC%/libs/Synopse/SQLite3 -Fu%UB_SRC%/libs/Synopse/SyNode -Fu%UB_SRC%/libs/synapse40/source/lib ^
  -Fu%LAZ_DIR%/lcl/units/%ARCH%-%TARGET% -Fu%LAZ_DIR%/components/lazutils/lib/%ARCH%-%TARGET% -Fu%LAZ_DIR%/lcl ^
  -FU.dcu/fpc-win64 -FEbin/x86_64 -obin/x86_64/ubmail.dll ^
  -dFPC_SYNCMEM ^
  -B -Se1 ./src/ubmail.dpr
@if errorlevel 1 goto err

goto :eof


:err
@echo Build fail
EXIT 1

:eof
