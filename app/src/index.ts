import {ServiceRegistry} from './config/service-registry';

const serviceRegistry = new ServiceRegistry();

serviceRegistry.initServices();



process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);

function handleTermination(args) {
    console.info(`Received ${args} - shutting down`);
    serviceRegistry.destructServices()
        .then(() => process.exit(0));
}
