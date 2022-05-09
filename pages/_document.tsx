import { Head, Html, Main, NextScript } from "next/document";
import React from "react";

export default function Document() {
  return (
    <Html>
      <Head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/site.webmanifest" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/inter-ui/3.19.3/inter.min.css"
          integrity="sha512-8vEtrrc40OAQaCUaqVjNMQtQEPyNtllVG1RYy6bGEuWQkivCBeqOzuDJPPhD+MO6y6QGLuQYPCr8Nlzu9lTYaQ=="
          crossOrigin="anonymous"
        />
        <meta name="theme-color" content="#f9fafb" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <div id="portal"></div>
      </body>
    </Html>
  );
}
