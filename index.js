const execSync = require("child_process").execSync;
const winston = require("winston");
const join = require("path").join;
const debug = require('debug')('logstat');

const COUNT = process.env.COUNT || 5;
const filename = process.env.FILE || join(process.cwd(), "logstat.log");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    new winston.transports.File({
        filename,
        maxsize: 10000000,
        timestamp:true,
        maxFiles: 2,
    })
  ]
});

console.log(`Start logger in ${filename}`);

function logStat() {
    const command = "ps -eo pid=,%mem=,%cpu=,cmd= --sort=-%mem";

    const result = execSync(command);
    const parsed = result
      .toString()
      .split("\n")
      .map(row => {
        const [pid, mem, cpu, ...cmd] = row.replace(/ +(?= )/g, "").trim().split(" ");
        return {
          pid,
          cmd: cmd.join(' '),
          mem: parseFloat(mem),
          cpu: parseFloat(cpu)
        };
      });
    const sortedByMem = [...parsed.sort((a, b) => b.mem - a.mem)];
    const sortedByCpu = [...parsed.sort((a, b) => b.cpu - a.cpu)];

    const topMem = sortedByMem.slice(0, COUNT);
    const topCpu = sortedByCpu.slice(0, COUNT);
    const data = {
        time: new Date,
        topMem,
        topCpu,
    };
    logger.info(data);
    debug(data);
}

setInterval(logStat, 1000);
