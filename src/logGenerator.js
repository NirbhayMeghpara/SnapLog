import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { SERVICES, LOG_LEVELS, LOG_MESSAGES, HOSTS, LOG_LEVELS_NAME } from "./utils/constants.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LogGenerator {
  constructor() {
    this.services = Object.values(SERVICES)
    this.logLevels = Object.values(LOG_LEVELS_NAME)
    this.messages = LOG_MESSAGES
    this.hosts = Object.values(HOSTS)
  }

  generateLogEntry() {
    const service = this.randomSelect(this.services)
    const level = this.randomSelect(this.logLevels)

    return {
      timestamp: new Date().toISOString(),
      service: service,
      level: level,
      message: this.randomSelect(this.messages[level]),
      traceId: uuidv4(),
      metadata: {
        host: this.randomSelect(this.hosts),
        pid: Math.floor(Math.random() * 9999),
        ip: this.generateIP(),
      },
    }
  }

  randomSelect(array) {
    return array[Math.floor(Math.random() * array.length)]
  }

  generateIP() {
    return Array.from({ length: 4 }, () => Math.floor(Math.random() * 255)).join(".")
  }

  generateLogFile(numberOfLogs, filename) {
    const testDataDir = path.join(__dirname, "../test/testData")
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true })
    }

    const filePath = path.join(testDataDir, filename)
    const logs = Array.from({ length: numberOfLogs }, () => this.generateLogEntry())

    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2))
    console.log(`Generated ${numberOfLogs} logs in test/testData/${filename}`)
  }
}

const generator = new LogGenerator()

generator.generateLogFile(10000, "small_logs.json")
generator.generateLogFile(100000, "medium_logs.json")
generator.generateLogFile(1000000, "large_logs.json")

export default LogGenerator;