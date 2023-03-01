const template = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="format-detection"
      content="telephone=no, date=no, address=no, email=no"
    />
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings
            xmlns:o="urn:schemas-microsoft-com:office:office"
          >
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <style>
        td,
        th,
        div,
        p,
        a,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-family: "Segoe UI", sans-serif;
          mso-line-height-rule: exactly;
        }
      </style>
    <![endif]-->
    <title>Please verify your email address</title>
    <style>
      .hover-underline:hover {
        text-decoration-line: underline !important;
      }
      .hover-no-underline:hover {
        text-decoration-line: none !important;
      }
      @media (max-width: 600px) {
        .sm-w-full {
          width: 100% !important;
        }
        .sm-py-8 {
          padding-top: 32px !important;
          padding-bottom: 32px !important;
        }
        .sm-px-6 {
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
      }
    </style>
  </head>
  <body
    style="
      margin: 0;
      width: 100%;
      padding: 0;
      word-break: break-word;
      -webkit-font-smoothing: antialiased;
      background-color: #fff;
    "
  >
    <div style="display: none">
      Use the 6-digit code provided to complete the verification process.&#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &zwnj; &#160;&#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
      &#847; &#847; &#847; &#847; &zwnj; &#160;&#847; &#847; &#847; &#847;
      &#847;
    </div>
    <div
      role="article"
      aria-roledescription="email"
      aria-label="Please verify your email address"
      lang="en"
    >
      <table
        style="
          width: 100%;
          font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
            sans-serif;
        "
        cellpadding="0"
        cellspacing="0"
        role="presentation"
      >
        <tr>
          <td
            align="center"
            class="sm-py-8"
            style="padding-top: 64px; padding-bottom: 64px"
          >
            <table
              class="sm-w-full"
              style="width: 480px"
              cellpadding="0"
              cellspacing="0"
              role="presentation"
            >
              <tr>
                <td
                  style="
                    padding-left: 32px;
                    padding-right: 32px;
                    color: #334155;
                  "
                >
                  <a href="<%= it.homePageUrl %>">
                    <img
                      src="<%= it.homePageUrl %>/logo.png"
                      width="150"
                      alt="Rallly"
                      style="
                        max-width: 100%;
                        vertical-align: middle;
                        line-height: 100%;
                        border: 0;
                      "
                    />
                  </a>
                </td>
              </tr>
              <tr>
                <td
                  align="center"
                  class="sm-px-6"
                  style="
                    padding: 32px;
                    text-align: left;
                    font-size: 16px;
                    line-height: 24px;
                    color: #475569;
                  "
                >
                  <table
                    style="width: 100%"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation"
                  >
                    <tr>
                      <td>
                        <p
                          style="
                            margin: 0;
                            margin-bottom: 32px;
                            line-height: 24px;
                          "
                        >
                          Hey <strong id="name"><%= it.name %></strong>,
                        </p>
                        <div
                          style="
                            margin-bottom: 32px;
                            border-radius: 8px;
                            background-color: #f9fafb;
                            padding-top: 16px;
                            padding-bottom: 16px;
                            text-align: center;
                          "
                        >
                          <p
                            style="
                              margin: 0;
                              margin-bottom: 16px;
                              line-height: 24px;
                            "
                          >
                            Your 6-digit code is:
                          </p>
                          <p
                            style="
                              margin: 0;
                              margin-bottom: 16px;
                              text-align: center;
                              font-size: 30px;
                              font-weight: 700;
                              line-height: 32px;
                              letter-spacing: 8px;
                              color: #1e293b;
                            "
                            id="code"
                          >
                            <%= it.code %>
                          </p>
                          <p
                            style="
                              margin: 0;
                              text-align: center;
                              line-height: 24px;
                            "
                          >
                            This code is valid for 10 minutues.
                          </p>
                        </div>
                        <p style="margin: 0; line-height: 24px">
                          Use this code to complete the verification process.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table
                          style="width: 100%"
                          cellpadding="0"
                          cellspacing="0"
                          role="presentation"
                        >
                          <tr>
                            <td style="padding-top: 32px; padding-bottom: 32px">
                              <div
                                style="
                                  height: 1px;
                                  background-color: #e5e7eb;
                                  line-height: 1px;
                                "
                              >
                                &zwnj;
                              </div>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 0; text-align: center">
                          Not sure why you received this email? Please
                          <a
                            href="mailto:<%= it.supportEmail %>"
                            class="hover-no-underline"
                            style="
                              color: #6366f1;
                              text-decoration-line: underline;
                            "
                            >let us know</a
                          >.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td
                  class="sm-px-6"
                  style="
                    padding-left: 32px;
                    padding-right: 32px;
                    text-align: center;
                    font-size: 14px;
                    color: #4b5563;
                  "
                >
                  <p style="cursor: default">
                    <a
                      href="<%= it.homePageUrl %>"
                      class="hover-underline"
                      style="color: #6366f1; text-decoration-line: none"
                      >Home</a
                    >
                    &bull;
                    <a
                      href="https://twitter.com/ralllyco"
                      class="hover-underline"
                      style="color: #6366f1; text-decoration-line: none"
                      >Twitter</a
                    >
                    &bull;
                    <a
                      href="https://github.com/lukevella/rallly"
                      class="hover-underline"
                      style="color: #6366f1; text-decoration-line: none"
                      >Github</a
                    >
                    &bull;
                    <a
                      href="https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E"
                      class="hover-underline"
                      style="color: #6366f1; text-decoration-line: none"
                      >Donate</a
                    >
                    &bull;
                    <a
                      href="mailto:<%= it.supportEmail %>"
                      class="hover-underline"
                      style="color: #6366f1; text-decoration-line: none"
                      >Contact</a
                    >
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;

export default template;
