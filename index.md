# Measuring IPI Latencies

This page shows a latency matrix for one-way inter-processor interrupts (IPIs)
between cores on several machines. Select a machine to see its latency matrix.
Note that entries along the diagonal (self IPIs) are not included.

{% include heatmap.html %}

## Adding more machine profiles

Clone [nautilus](https://github.com/hexsa-lab/nautilus), then modify the default boot configuration (by modifying `configs/grub.cfg`) to contain
the following contents

```
set timeout=0
set default=0

menuentry "Nautilus" {
    multiboot2 /boot/nautilus.bin -test ipitest "-s all -d all -t oneway -n 100"
    module2 /boot/nautilus.syms
    module2 /boot/nautilus.secs
    boot
}
```

Then configure Nautilus by running `make menuconfig`. Enable the following options:
- `Configuration->Run all tests from the testing framework at boot`
- `Configuration->Mirror virtual console log output to serial`
- `Configuration->Mirror virtual...->Mirror all...`
- `Devices->Serial Redirect`

Build Nautilus by running `make isoimage` (include the `-j` option if you have a multi-core machine). You can test your configuration
using QEMU:

```
$ qemu-system-x86-64 -smp 4 -cdrom nautilus.iso -device isa-debug-exit -serial stdio -m 2G -monitor /dev/null -nographic
```

You should see pretty large output here (4 cores times 2 experiments times 100 trials = 800 lines)

Now run Nautilus on your machine (ask the principals how to do this, it depends on your setup), and capture the output in some file, call it `foo`.
Then from the top-level Nautilus directory generate a CSV file from your output using our provided script:

```
$ scripts/ipi/ipi_output_to_csv.py foo > foo.csv
```

Send this file to Kyle with a description of the machine (as detailed as possible), and he'll add an entry here.
