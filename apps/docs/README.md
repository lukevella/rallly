# Support Docs

Live site: [https://support.rallly.co](https://support.rallly.co)

This site is kindly built and hosted by [Mintlify](https://mintlify.com).

### Contributing Guide

To contribute to the docs, you can fork this repository and submit a pull request.

```
git clone https://github.com/lukevella/rallly.git && cd rallly
```

To get to this directory from the root of this repo:

```
cd apps/docs
```

Theses docs are written in [MDX](https://mdxjs.com/) which is mostly [Markdown](https://www.markdownguide.org/cheat-sheet/) with the ability to use components inside.

#### Components

There are a number of useful components to use such as [Accordion](https://mintlify.com/docs/components/accordion), [Tabs](https://mintlify.com/docs/components/tabs) and [Callouts](https://mintlify.com/docs/components/callouts). They are all documented [here](https://mintlify.com/docs/components) and it may help to be familiar with these.

#### Local Preview

You can run the development server to preview your changes locally.

##### From this directory:

Install the dependencies:

```
yarn install
```

Run the development server:

```
yarn dev
```

Go to http://localhost:4000

##### From the root of this repository:

If you're only making changes to the docs you can run the following command to install only the dependencies for the docs:

```bash
yarn workspace @rallly/docs install
```

Otherwise you can run `yarn install` to install dependencies for the entire project

Then, run the development server:

```bash
yarn docs:dev
```

Go to http://localhost:4000
