# Caddy Reverse Proxy with Forever PM and Manual MongoDB Configuration

To setup Rallly manually with Caddy, Forever, and MongoDB, follow these instructions. 

- Step 1 - [Install MongoDB](#install-mongodb)
- Step 2 - [Setup Rallly](#setup-rallly)
- Step 3 - [Install and Configure Caddy](#install-and-configure-caddy)

## Install MongoDB
Start by installing MongoDB

### Step 1 - Add the MongoDB APT Repository
```bash
# Import the key for the official MongoDB repository
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927

# Add MongoDB to your APT list
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list

# Update the packages list.
sudo apt-get update
```
### Step 2 - Install MongoDB

To install MongoDB, run the following.

```bash
sudo apt-get install -y mongodb-org
```

To run MongoDB, you need to create a `systemd` config file. 

```bash
sudo nano /etc/systemd/system/mongodb.service
```
Paste in the following contents, then save and close the file.

```
[Unit]
Description=High-performance, schema-free document-oriented database
After=network.target

[Service]
User=mongodb
ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

[Install]
WantedBy=multi-user.target
```

Then to start MongoDB, run the following. 
```bash
sudo systemctl enable mongodb
sudo systemctl start mongodb
```
That's all! Now MongoDB is installed and will start on boot. 

_Some of this has been taken from Digital Oceans article called "How to Install MongoDB on Ubuntu 16.04" which is located [here](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04)._

## Setup Rallly
Now that we have the database ready to go, we need to setup Rallly's Express server. 

### Step 1 - Configure Rallly

First, clone the Rallly repository.

```bash
git clone git@github.com:lukevella/Rallly.git
cd Rallly
```
Run the install script. This will install the Node and Bower dependencies and create a configuration file.

```bash
npm run installation
```

You can open the `config.json` and change configuration after running the installation process. 

Check to make sure the Node server starts. 
```bash
npm start
```

### Step 2 - Configure Forever
To configure Forever, run the following.

```bash
# Install Forever
[sudo] npm install -g forever

# Start the forever daemon
forever start ./bin/www
```

That's all! Now you have Rallly running on port `3000`!

## Install and Configure Caddy

First, [download](https://caddyserver.com/download) caddy and put the binary in the system wide binary directory and give it
appropriate ownership and permissions:

```bash
sudo cp /path/to/caddy /usr/local/bin
sudo chown root:root /usr/local/bin/caddy
sudo chmod 755 /usr/local/bin/caddy
```

Give the caddy binary the ability to bind to privileged ports (e.g. 80, 443) as a non-root user:

```bash
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/caddy
```

Set up the user, group, and directories that will be needed:

```bash
sudo groupadd -g 33 www-data
sudo useradd \
  -g www-data --no-user-group \
  --home-dir /var/www --no-create-home \
  --shell /usr/sbin/nologin \
  --system --uid 33 www-data

sudo mkdir /etc/caddy
sudo chown -R root:www-data /etc/caddy
sudo mkdir /etc/ssl/caddy
sudo chown -R www-data:root /etc/ssl/caddy
sudo chmod 0770 /etc/ssl/caddy
```
Create the Caddyfile
```bash
sudo nano /etc/caddy/Caddyfile
```

Paste the following into the Caddyfile.
```
rallly.example.com {
    tls you@example.com

    errors {
        log ../error.log
    }

    proxy / 127.0.0.1:3000 {
        health_check /health
        transparent
    }
}
```

Then, give it appropriate ownership and permissions:

```bash
sudo chown www-data:www-data /etc/caddy/Caddyfile
sudo chmod 444 /etc/caddy/Caddyfile
```

Install the systemd service unit configuration file , reload the systemd daemon,
and start caddy:

```bash
wget https://github.com/mholt/caddy/raw/master/dist/init/linux-systemd/caddy.service
sudo cp caddy.service /etc/systemd/system/
sudo chown root:root /etc/systemd/system/caddy.service
sudo chmod 644 /etc/systemd/system/caddy.service
sudo systemctl daemon-reload
sudo systemctl start caddy.service
```

Have the caddy service start automatically on boot if you like:

```bash
sudo systemctl enable caddy.service
```

_Most of this has been taken from Caddy's systemd configuration instructions which are located [here](https://github.com/mholt/caddy/tree/master/dist/init/linux-systemd)._

## Conclusion

That's all! Now you just need to go to your server's address and create an event!
