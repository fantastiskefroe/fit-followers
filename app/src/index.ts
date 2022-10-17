import {ServiceRegistry} from './config/service-registry';
import {ExpressService} from './service/express-service';
import {MqttService} from './service/mqtt-service';

const serviceRegistry = new ServiceRegistry();
const mqttService = new MqttService();
serviceRegistry.registerService(mqttService);
serviceRegistry.registerService(new ExpressService(mqttService));

serviceRegistry.initServices();



process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);

function handleTermination(args) {
    console.info(`Received ${args} - shutting down`);
    serviceRegistry.destructServices()
        .then(() => process.exit(0));
}
