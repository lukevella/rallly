# Setting Up Rallly in a Production Environment

To setup Rallly in a production environment, there are a few options. The first and most complicated option is to run Rallly on port 80 and manually setup a MongoDB instance. 

## Web Server
Here are some options for web servers. 

_These examples assume that you have Express running on port `3000` and that you have MongoDB installed._

### Express
This option is just using Express's web server. However, this is not recommended in a production environment. The reasoning for that can be found [here](https://expressjs.com/en/advanced/best-practice-performance.html#use-a-reverse-proxy).

To use Express alone, simply set the port to `80` in the `config.json` and run the following:
```bash
npm start
```

If you want Rallly to automatically restart, you can use a process manager like [PM2](https://github.com/Unitech/pm2), [Forever](https://www.npmjs.com/package/forever) or [StrongLoop Process Manager](http://strong-pm.io).

To use Forever, run the following:
```bash
# Install forever
[sudo] npm install forever -g

# Start the daemon
forever start ./bin/www
```
For more details on keeping Express running, check out [this](https://expressjs.com/en/advanced/best-practice-performance.html#ensure-restart) page. 

### Caddy

[Caddy](https://caddyserver.com) can be used to reverse proxy Express. One of the great benefits of Caddy is that it automatically generates SSL certificates for you with [Let's Encrypt](https://letsencrypt.org). 

You can find an example `Caddyfile` [here](examples/Caddyfile).

Instructions for running Caddy as a daemon are [here](https://github.com/mholt/caddy/tree/master/dist/init).

### NGINX
[NGINX](https://www.nginx.com) can also be used to reverse proxy Express. 

You can find an example NGINX config file with [Let's Encrypt](https://letsencrypt.org) SSL config file [here](examples/nginx.conf) and without SSL [here](examples/nginx-no-ssl.conf).

### Apache
[Apache](https://httpd.apache.org) is another option that can be used to reverse proxy Express.

You can find an example Apache config file [here](examples/apache.conf).

More detailed instructions on using Apache can be found [here](https://www.digitalocean.com/community/tutorials/how-to-use-apache-as-a-reverse-proxy-with-mod_proxy-on-ubuntu-16-04).

## Database ([MongoDB](https://www.mongodb.com))

Rallly needs a database to store data. We use MongoDB. There are two options for running MongoDB.

1. Manually install and configure MongoDB (hard)
2. Run MongoDB with [Docker](https://www.docker.com) (really easy)

Instructions for installing and configuring MongoDB on Ubuntu can be found [here](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04).

To run MongoDB with Docker, simply run the following and you are done. 

```bash
docker run --name rallly-mongo -v /my/own/datadir:/data/db -d mongo:latest
```
_This assumes that you have Docker installed._

## Examples
- [Caddy Reverse Proxy with Forever PM and Manual MongoDB Configuration](caddy-forever-mongodb.md)
- [The Easy Way With Docker](#docker-the-easy-way)


## Docker (The Easy Way)

*This assumes that you have Docker installed*

To get started quickly and easily, simply run the following:

```bash
git clone git@github.com:lukevella/Rallly.git
cd Rallly
```
Copy the sample `.env` file then open it and set the variables. 
```bash
cp sample.env .env
```
Now run it!
```bash
docker-compose up -d
```

Now that was simple! This will start the following containers:
- Rallly Express
- MongoDB
- Caddy
