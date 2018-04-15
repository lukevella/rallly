var fs = require('fs');
var prompt = require('prompt');
var argv = require('yargs').argv;
var env = process.env;

fs.stat('config.json', function (err, stats) {
    if (err) {
        console.log('Configuration does not exists. Generating... ');
        generateConfig();
    } else {
        if (argv.f) {
            console.log('Overwriting config.json...')
            generateConfig();
        } else {
            console.log('Configuration exists already. Doing nothing.');
        }
    }
});

function generateConfig() {
    fs.readFile('config.sample.json', 'utf8', function (err, data) {
        if (err) {
            console.log(err)
        }
        if (argv.p) {
            fs.createReadStream('config.sample.json').pipe(fs.createWriteStream('config.json'));
            console.log('\nConfiguration file generated! Please open config.json and set the proper settings!');
        } else {
            if (argv.d) {
                console.log('Configuration for docker...');
                var json = {
                    "port": env.PORT,
                    "siteUrl": env.SITE_URL,
                    "fromName": env.FROM_NAME,
                    "fromEmail": env.FROM_EMAIL,
                    "db": env.MONGO_URL,
                    "smtpHost": env.SMTP_HOST,
                    "smtpPort": env.SMTP_PORT,
                    "smtpUser": env.SMTP_USER,
                    "smtpPwd": env.SMTP_PWD,
                    "smtpSecure": env.SMTP_SECURE
                }
                fs.writeFile("config.json", JSON.stringify(json), function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("\nConfiguration file generated!");
                });
            } else {
                var obj = JSON.parse(data);
                var schema = {
                    properties: {
                        port: {
                            pattern: /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/,
                            message: 'Port must be only numbers',
                            type: 'integer',
                            required: true,
                            default: obj.port,
                        },
                        siteUrl: {
                            type: 'string',
                            description: 'Used for creating an absolute URL. No trailing slashes. If port is not 80 or 443, include port number. ',
                            required: true,
                            default: obj.siteUrl,
                        },
                        fromName: {
                            type: 'string',
                            description: 'Email from name.',
                            required: true,
                            default: obj.fromName,
                        },
                        fromEmail: {
                            type: 'string',
                            description: 'Email from address.',
                            required: true,
                            default: obj.fromEmail,
                        },
                        db: {
                            type: 'string',
                            description: 'MongoDB connection string.',
                            required: true,
                            default: obj.db,
                        },
                        smtpHost: {
                            type: 'string',
                            description: 'SMTP host.',
                            default: obj.smtpHost,
                        },
                        smtpPort: {
                            type: 'integer',
                            description: 'SMTP port.',
                            default: obj.smtpPort,
                        },
                        smtpUser: {
                            type: 'string',
                            description: 'SMTP user name.',
                            default: obj.smtpUser,
                        },
                        smtpPwd: {
                            type: 'string',
                            hidden: true,
                            description: 'SMTP user password.',
                            default: obj.smtpPwd,
                        },
                        smtpSecure: {
                            type: 'boolean',
                            description: 'SMTP secure.',
                            default: obj.smtpSecure,
                        }
                    }
                };
                prompt.start();

                prompt.get(schema, function (err, result) {
                    fs.writeFile("config.json", JSON.stringify(result), function (err) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log("\nConfiguration file generated!");
                    });
                });
            }
        }
    });
}
