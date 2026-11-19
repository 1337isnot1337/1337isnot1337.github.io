`timescale 1ns/1ps
module trace_monitor;
initial begin
  $display("TRACE time_ns,fetch_pc,fetch_inst,execute_pc,execute_inst,A,D,predicted_next,actual_next,mispredict,ghr,pht");
end
always @(negedge mod_cpu_tests.clk) begin
  if (!mod_cpu_tests.reset)
    $display("TRACE %0d,%0d,%04h,%0d,%04h,%0d,%0d,%0d,%0d,%0d,%02h,%02b",$time,mod_cpu_tests.dut.pc_f,mod_cpu_tests.inst,mod_cpu_tests.dut.ex_pc,mod_cpu_tests.dut.ex_inst,mod_cpu_tests.dut.a_reg,mod_cpu_tests.dut.d,mod_cpu_tests.dut.ex_pred_next_pc,mod_cpu_tests.dut.ex_actual_next_pc,mod_cpu_tests.dut.ex_mispredict,mod_cpu_tests.dut.current_ghr,mod_cpu_tests.dut.ghbp.phtCounter);
end
endmodule
