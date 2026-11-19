# Recorded Hack CPU pipeline trace

Source: `1337isnot1337/nand2tetris-verilog-improved`, commit
`063f0c4a24cefde327ffba93678ff5586608791d`.

These are RTL simulation snapshots, not hardware measurements. The website uses
170, 180, 190, 200 and 210 ns from the existing testbench. Samples are taken on
falling clock edges, after the preceding rising-edge nonblocking assignments
have settled. The testbench clock has a 10 ns period; reset is released at 12 ns.

At 190 ns, execute holds address 6 (`D;JGT`) with D=0 and A=5. Its saved
prediction selected address 5, but the correct next address is 7. At the 195 ns
rising edge, address 5's fetched subtraction is discarded. At 200 ns, execute
contains an inserted NOP and fetch reads address 7. The inserted NOP's ex_pc
register is reset to 0; this is NOT execution of program address 0. D remains 0.
At 210 ns the original program NOP at address 7 executes while address 8 is fetched.

## Sources

- https://github.com/1337isnot1337/nand2tetris-verilog-improved/blob/063f0c4a24cefde327ffba93678ff5586608791d/05/mod_cpu_tests.sv#L42-L65
- https://github.com/1337isnot1337/nand2tetris-verilog-improved/blob/063f0c4a24cefde327ffba93678ff5586608791d/05/cpu_optimized.sv#L131-L207
- https://github.com/1337isnot1337/nand2tetris-verilog-improved/blob/063f0c4a24cefde327ffba93678ff5586608791d/05/globalHistoryBranchPredictor.sv
- https://github.com/1337isnot1337/nand2tetris-verilog-improved/blob/063f0c4a24cefde327ffba93678ff5586608791d/02/alu_optimized.sv

## Reproduce

Put this packet's `monitor.sv` and `harness.sv` in an empty working directory.
Download the pinned, unmodified sources:

```sh
mkdir -p 02 05
base=https://raw.githubusercontent.com/1337isnot1337/nand2tetris-verilog-improved/063f0c4a24cefde327ffba93678ff5586608791d
for f in 02/alu_optimized.sv 05/cpu_optimized.sv 05/globalHistoryBranchPredictor.sv 05/mod_cpu_tests.sv; do
  curl -fL "$base/$f" -o "$f"
done
cd 05
iverilog -g2012 -s mod_cpu_tests -s trace_monitor -o ../monitored mod_cpu_tests.sv cpu_optimized.sv ../monitor.sv
vvp ../monitored | grep '^TRACE' | sed 's/^TRACE //' | head -21 > ../trace.csv
verilator --binary --timing -Wno-fatal --top-module trace_harness --Mdir ../obj mod_cpu_tests.sv cpu_optimized.sv ../monitor.sv ../harness.sv
../obj/Vtrace_harness | grep '^TRACE' | sed 's/^TRACE //' | head -21 > ../verilator-trace.csv
diff -u ../trace.csv ../verilator-trace.csv
```

Verified with Icarus Verilog 13.0 and Verilator 5.054: identical 20–210 ns prefix.
The original testbench's constant-only `rdata` combinational block produces an
Icarus sensitivity warning. The selected prefix never reads external memory;
independent Verilator agreement verifies this window. Later memory-dependent
behavior is outside this artifact's scope. No source RTL or testbench was edited.
