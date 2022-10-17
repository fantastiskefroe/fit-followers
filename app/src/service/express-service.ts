import {Service} from '../model/service';
import express, {Request, Response} from 'express';
import cors from 'cors';
import {MqttService} from './mqtt-service';

export class ExpressService implements Service {
    public readonly name = 'Express';
    public readonly environmentVariables = [
        'PORT'
    ];

    constructor(mqttService: MqttService) {
        this.mqttService = mqttService;
    }

    private server;
    private mqttService: MqttService;

    public init(): Promise<void> {
        const app = express();
        const port = process.env.PORT;

        app.use(express.json());
        app.use(cors());

        app.post('/publish/:topic', this.publish.bind(this));

        return new Promise(resolve => {
            this.server = app.listen(port, () => {
                console.log(`Listening on port ${port}`);
                resolve();
            });
        });
    }

    private publish(req: Request, res: Response) {
        const topic = req.params.topic;
        const body = req.body;
        const bodyString = JSON.stringify(body);

        console.log('Received topic body', topic, bodyString);

        this.mqttService.publish(topic, bodyString)
            .then((err) => {
                if (err) {
                    res.json({success: false, error: err});
                } else {
                    res.json({success: true});
                }
            });
    }

    public destruct(): Promise<void> {
        return new Promise(resolve => {
            this.server.close(() => resolve());
        });
    }
}
