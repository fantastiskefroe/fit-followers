import {ServiceRegistry} from './config/service-registry';
import {InfluxService} from './service/influx-service';
import {StatsService} from './service/stats-service';
import {ScheduleService} from './service/schedule-service';

const serviceRegistry = new ServiceRegistry();

const influxService = new InfluxService();
serviceRegistry.registerService(influxService);
const statsService = new StatsService(influxService);
serviceRegistry.registerService(statsService);
serviceRegistry.registerService(new ScheduleService(statsService.accountJob.bind(statsService)));

serviceRegistry.initServices();



process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);

function handleTermination(args) {
    console.info(`Received ${args} - shutting down`);
    serviceRegistry.destructServices()
        .then(() => process.exit(0));
}
