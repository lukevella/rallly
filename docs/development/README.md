# Setting Up Rallly in a Development Environment

To setup your development environment, follow these steps.

### Step 1 - Run MongoDB
You need to run MongoDB locally or use an external MongoDB instance. 

To quickly get started with MongoDB run it with Docker.
```bash
docker run --name rallly-mongo -v /my/own/datadir:/data/db -P 27017:27017 -d mongo:latest
```

You now have a MongoDB instance ready to go for development!
### Step 2 - Configure Rallly
Now you need to configure Rallly and install all of the dependencies. To do so, run the following:

```bash
npm run installation
```
For a development environment, you probably will want to accept most of the defaults besides the SMTP defaults. 

### Step 3 - Running
Run the `watch` task with gulp. Gulp is used to build the css (with sass), js and templates.

```bash
gulp watch
npm start
```

Now browse to [localhost:3000](http://localhost:3000)!
